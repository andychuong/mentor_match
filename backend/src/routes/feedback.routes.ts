import { Router } from 'express';
import { body } from 'express-validator';
import { feedbackService } from '../services/feedback.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Submit feedback
router.post(
  '/',
  authenticate,
  validate([
    body('sessionId').isUUID().withMessage('Valid session ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('helpfulnessRating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Helpfulness rating must be between 1 and 5'),
    body('wouldRecommend').isBoolean(),
    body('writtenFeedback').optional().isString().trim(),
    body('topicsCovered').optional().isArray(),
    body('isAnonymous').optional().isBoolean(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const feedback = await feedbackService.createFeedback({
        ...req.body,
        menteeId: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: { feedback },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get feedback by session
router.get('/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const feedback = await feedbackService.getFeedbackBySession(
      req.params.sessionId,
      req.user!.id
    );

    res.json({
      success: true,
      data: { feedback },
    });
  } catch (error) {
    next(error);
  }
});

// Get mentor feedback
router.get(
  '/mentors/:mentorId',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await feedbackService.getMentorFeedback(
        req.params.mentorId,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get feedback statistics
router.get('/stats/:mentorId', authenticate, async (req, res, next) => {
  try {
    const stats = await feedbackService.getFeedbackStats(req.params.mentorId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

