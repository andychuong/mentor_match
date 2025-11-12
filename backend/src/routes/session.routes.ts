import { Router } from 'express';
import { body, query } from 'express-validator';
import { sessionService } from '../services/session.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// List sessions
router.get(
  '/',
  authenticate,
  validate([
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('mentorId').optional().isUUID(),
    query('menteeId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await sessionService.getSessions({
        userId: req.user!.id,
        role: req.user!.role,
        status: req.query.status as string,
        mentorId: req.query.mentorId as string,
        menteeId: req.query.menteeId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });

      // Transform to match frontend expected format
      res.json({
        success: true,
        data: {
          items: result.sessions,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get session details
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await sessionService.getSession(req.params.id, req.user!.id);
    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    next(error);
  }
});

// Create session
router.post(
  '/',
  authenticate,
  validate([
    body('mentorId').isUUID().withMessage('Valid mentor ID is required'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
    body('durationMinutes').optional().isInt({ min: 15, max: 240 }),
    body('topic').optional().isString().trim(),
    body('notes').optional().isString().trim(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const session = await sessionService.createSession({
        ...req.body,
        menteeId: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: { session },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update session
router.put(
  '/:id',
  authenticate,
  validate([
    body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    body('scheduledAt').optional().isISO8601(),
    body('topic').optional().isString().trim(),
    body('notes').optional().isString().trim(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const session = await sessionService.updateSession(
        req.params.id,
        req.user!.id,
        req.body
      );

      res.json({
        success: true,
        data: { session },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete session
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await sessionService.deleteSession(req.params.id, req.user!.id);
    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

