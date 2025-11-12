import { Router } from 'express';
import { query, body, param } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { googleCalendarService } from '../services/googleCalendar.service';
import { outlookCalendarService } from '../services/outlookCalendar.service';
import { calendarIntegrationService } from '../services/calendarIntegration.service';
import { AppError, errorCodes } from '../utils/errors';
import { prisma } from '../config/database';

const router = Router();

// Get OAuth URL for Google Calendar
router.get(
  '/google/auth-url',
  authenticate,
  validate([query('state').optional().isString()]),
  async (req: AuthRequest, res, next) => {
    try {
      const state = (req.query.state as string) || req.user!.id;
      const authUrl = googleCalendarService.getAuthUrl(state);
      res.json({ success: true, data: { authUrl } });
    } catch (error) {
      next(error);
    }
  }
);

// Get OAuth URL for Outlook Calendar
router.get(
  '/outlook/auth-url',
  authenticate,
  validate([query('state').optional().isString()]),
  async (req: AuthRequest, res, next) => {
    try {
      const state = (req.query.state as string) || req.user!.id;
      const authUrl = outlookCalendarService.getAuthUrl(state);
      res.json({ success: true, data: { authUrl } });
    } catch (error) {
      next(error);
    }
  }
);

// Handle Google OAuth callback
router.post(
  '/google/callback',
  authenticate,
  validate([
    body('code').notEmpty().withMessage('Authorization code is required'),
    body('calendarId').optional().isString(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const { code, calendarId } = req.body;
      const userId = req.user!.id;

      const tokens = await googleCalendarService.getTokens(code);
      await calendarIntegrationService.createOrUpdateIntegration(
        userId,
        'google',
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresAt,
        calendarId
      );

      res.json({
        success: true,
        message: 'Google Calendar connected successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Handle Outlook OAuth callback
router.post(
  '/outlook/callback',
  authenticate,
  validate([
    body('code').notEmpty().withMessage('Authorization code is required'),
    body('calendarId').optional().isString(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const { code, calendarId } = req.body;
      const userId = req.user!.id;

      const tokens = await outlookCalendarService.getTokens(code);
      await calendarIntegrationService.createOrUpdateIntegration(
        userId,
        'outlook',
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresAt,
        calendarId
      );

      res.json({
        success: true,
        message: 'Outlook Calendar connected successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's calendar integrations
router.get('/integrations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const integrations = await prisma.calendarIntegration.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        provider: true,
        calendarId: true,
        isEnabled: true,
        syncEnabled: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: { integrations } });
  } catch (error) {
    next(error);
  }
});

// Get calendar list for a provider
router.get(
  '/:provider/calendars',
  authenticate,
  validate([param('provider').isIn(['google', 'outlook'])]),
  async (req: AuthRequest, res, next) => {
    try {
      const provider = req.params.provider as 'google' | 'outlook';
      const integration = await calendarIntegrationService.getIntegration(req.user!.id, provider);

      if (!integration || !integration.isEnabled) {
        throw new AppError(404, errorCodes.NOT_FOUND, `${provider} calendar not connected`);
      }

      // Refresh token if needed
      await calendarIntegrationService.refreshTokenIfNeeded(integration);

      const updatedIntegration = await prisma.calendarIntegration.findUnique({
        where: { id: integration.id },
      });

      if (!updatedIntegration) {
        throw new AppError(404, errorCodes.NOT_FOUND, 'Integration not found');
      }

      // Decrypt token (simplified - in production use proper encryption service)
      const crypto = require('crypto');
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
      const decrypt = (encryptedText: string) => {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      };

      const accessToken = decrypt(updatedIntegration.accessToken);
      const refreshToken = updatedIntegration.refreshToken ? decrypt(updatedIntegration.refreshToken) : undefined;

      let calendars: Array<{ id: string; name: string }> = [];
      if (provider === 'google') {
        const googleCalendars = await googleCalendarService.getCalendarList(accessToken, refreshToken);
        calendars = googleCalendars.map((c) => ({ id: c.id, name: c.summary }));
      } else if (provider === 'outlook') {
        calendars = await outlookCalendarService.getCalendarList(accessToken);
      }

      res.json({ success: true, data: { calendars } });
    } catch (error) {
      next(error);
    }
  }
);

// Toggle calendar sync
router.put(
  '/:provider/sync',
  authenticate,
  validate([
    body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const provider = req.params.provider as 'google' | 'outlook';
      const { enabled } = req.body;

      await calendarIntegrationService.toggleSync(req.user!.id, provider, enabled);

      res.json({
        success: true,
        message: `Calendar sync ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Disconnect calendar
router.delete('/:provider', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const provider = req.params.provider as 'google' | 'outlook';
    await calendarIntegrationService.disableIntegration(req.user!.id, provider);

    res.json({
      success: true,
      message: `${provider} calendar disconnected`,
    });
  } catch (error) {
    next(error);
  }
});

// Manually sync a session to calendars
router.post(
  '/sessions/:sessionId/sync',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { mentorId: true, menteeId: true },
      });

      if (!session) {
        throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
      }

      if (session.mentorId !== req.user!.id && session.menteeId !== req.user!.id) {
        throw new AppError(403, errorCodes.FORBIDDEN, 'Access denied');
      }

      await calendarIntegrationService.syncSessionToCalendar(sessionId);

      res.json({
        success: true,
        message: 'Session synced to calendars',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

