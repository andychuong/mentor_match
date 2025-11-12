import { Router } from 'express';
import { body } from 'express-validator';
import { notificationPreferenceService } from '../services/notificationPreference.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's notification preferences
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const preferences = await notificationPreferenceService.getPreferences(req.user!.id);
    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    next(error);
  }
});

// Update user's notification preferences
router.put(
  '/',
  validate([
    body('emailEnabled').optional().isBoolean(),
    body('emailSessionConfirmation').optional().isBoolean(),
    body('emailSessionReminder').optional().isBoolean(),
    body('emailSessionCancellation').optional().isBoolean(),
    body('emailSessionRequest').optional().isBoolean(),
    body('emailFeedbackConfirmation').optional().isBoolean(),
    body('smsEnabled').optional().isBoolean(),
    body('smsSessionReminder').optional().isBoolean(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const preferences = await notificationPreferenceService.updatePreferences(
        req.user!.id,
        req.body
      );
      res.json({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

