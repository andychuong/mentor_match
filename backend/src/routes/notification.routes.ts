import { Router } from 'express';
import { query, param } from 'express-validator';
import { notificationService } from '../services/notification.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await notificationService.getUserNotifications(req.user!.id, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark notification as read
router.put(
  '/:id/read',
  validate([param('id').isUUID()]),
  async (req: AuthRequest, res, next) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user!.id);

      res.json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
});

// Get delivery status for a notification
router.get(
  '/:id/delivery',
  validate([param('id').isUUID()]),
  async (req: AuthRequest, res, next) => {
    try {
      // Verify notification belongs to user
      const notification = await notificationService.getUserNotifications(req.user!.id, 1, 1000);
      const userNotification = notification.notifications.find((n) => n.id === req.params.id);

      if (!userNotification) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Notification not found' },
        });
        return;
      }

      const deliveries = await notificationService.getDeliveryStatus(req.params.id);

      res.json({
        success: true,
        data: { deliveries },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get delivery stats for user
router.get('/delivery/stats', async (req: AuthRequest, res, next) => {
  try {
    const stats = await notificationService.getDeliveryStats(req.user!.id);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

