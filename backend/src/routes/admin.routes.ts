import { Router } from 'express';
import { query, body } from 'express-validator';
import { prisma } from '../config/database';
import { userService } from '../services/user.service';
import { sessionService } from '../services/session.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { exportSessionsToCSV, exportUsersToCSV, exportFeedbackToCSV } from '../utils/csvExport';

const router = Router();

// All admin routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Platform analytics
router.get('/analytics', async (_req, res, next) => {
  try {
    const [
      totalSessions,
      completedSessions,
      totalUsers,
      activeMentors,
      totalFeedback,
      averageRating,
    ] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { status: 'completed' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'mentor', isActive: true } }),
      prisma.feedback.count(),
      prisma.feedback.aggregate({
        _avg: { rating: true },
      }),
    ]);

    // Calculate mentor utilization
    const mentorSessions = await prisma.session.groupBy({
      by: ['mentorId'],
      where: { status: 'completed' },
      _count: { id: true },
    });

    const utilizationRate =
      activeMentors > 0
        ? (mentorSessions.length / activeMentors) * 100
        : 0;

    res.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        totalUsers,
        activeMentors,
        totalFeedback,
        averageRating: averageRating._avg.rating || 0,
        mentorUtilizationRate: Math.round(utilizationRate * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Session analytics
router.get(
  '/analytics/sessions',
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ]),
  async (req, res, next) => {
    try {
      const where: {
        scheduledAt?: {
          gte?: Date;
          lte?: Date;
        };
      } = {};
      if (req.query.startDate || req.query.endDate) {
        where.scheduledAt = {};
        if (req.query.startDate) {
          where.scheduledAt.gte = new Date(req.query.startDate as string);
        }
        if (req.query.endDate) {
          where.scheduledAt.lte = new Date(req.query.endDate as string);
        }
      }

      const sessions = await prisma.session.findMany({
        where,
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              expertiseAreas: true,
            },
          },
        },
      });

      // Group by status
      const byStatus = sessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by date
      const byDate = sessions.reduce((acc, session) => {
        const date = new Date(session.scheduledAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: {
          total: sessions.length,
          byStatus,
          byDate,
          sessions: sessions.slice(0, 100), // Limit to 100 for response size
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mentor utilization analytics
router.get('/analytics/mentors', async (_req, res, next) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: 'mentor', isActive: true },
      include: {
        mentorSessions: {
          where: { status: 'completed' },
          select: { id: true },
        },
        mentorFeedback: {
          select: { rating: true },
        },
      },
    });

    const mentorStats = mentors.map((mentor) => {
      const averageRating =
        mentor.mentorFeedback.length > 0
          ? mentor.mentorFeedback.reduce((sum, f) => sum + f.rating, 0) /
            mentor.mentorFeedback.length
          : null;

      return {
        mentorId: mentor.id,
        name: mentor.name || mentor.email,
        totalSessions: mentor.mentorSessions.length,
        averageRating,
        expertiseAreas: mentor.expertiseAreas,
      };
    });

    res.json({
      success: true,
      data: { mentors: mentorStats },
    });
  } catch (error) {
    next(error);
  }
});

// List all users
router.get(
  '/users',
  validate([
    query('role').optional().isIn(['mentor', 'mentee', 'admin']),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req, res, next) => {
    try {
      const result = await userService.getUsers({
        role: req.query.role as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// List all sessions
router.get(
  '/sessions',
  validate([
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await sessionService.getSessions({
        userId: req.user!.id,
        role: 'admin',
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export data
router.post(
  '/export',
  validate([
    body('type').isIn(['sessions', 'users', 'feedback']),
    body('format').isIn(['csv', 'json']),
  ]),
  async (req, res, next) => {
    try {
      const { type, format } = req.body;

      if (type === 'sessions') {
        const sessions = await prisma.session.findMany({
          include: {
            mentor: { select: { name: true, email: true } },
            mentee: { select: { name: true, email: true } },
            feedback: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (format === 'json') {
          res.json({
            success: true,
            data: { sessions },
          });
        } else {
          const csv = exportSessionsToCSV(sessions);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=sessions-${Date.now()}.csv`);
          res.send(csv);
        }
      } else if (type === 'users') {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            expertiseAreas: true,
            industryFocus: true,
            startupStage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (format === 'json') {
          res.json({
            success: true,
            data: { users },
          });
        } else {
          const csv = exportUsersToCSV(users);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
          res.send(csv);
        }
      } else if (type === 'feedback') {
        const feedback = await prisma.feedback.findMany({
          include: {
            session: {
              select: {
                id: true,
                scheduledAt: true,
                topic: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (format === 'json') {
          res.json({
            success: true,
            data: { feedback },
          });
        } else {
          const csv = exportFeedbackToCSV(feedback);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=feedback-${Date.now()}.csv`);
          res.send(csv);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;

