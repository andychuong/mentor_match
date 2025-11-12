import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import mentorRoutes from './mentor.routes';
import sessionRoutes from './session.routes';
import feedbackRoutes from './feedback.routes';
import adminRoutes from './admin.routes';
import webhookRoutes from './webhook.routes';
import syncRoutes from './sync.routes';
import matchingRoutes from './matching.routes';
import notificationPreferenceRoutes from './notificationPreference.routes';
import notificationRoutes from './notification.routes';
import calendarRoutes from './calendar.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/mentors', mentorRoutes);
router.use('/sessions', sessionRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/sync', syncRoutes);
router.use('/matching', matchingRoutes);
router.use('/notification-preferences', notificationPreferenceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/calendar', calendarRoutes);

export default router;

