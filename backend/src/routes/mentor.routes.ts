import { Router } from 'express';
import { query, body } from 'express-validator';
import { matchingService } from '../services/matching.service';
import { userService } from '../services/user.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { matchingLimiter } from '../middleware/rateLimiter';
import { prisma } from '../config/database';
import { MatchFilters } from '../types';
import { transformUserToFrontendFormat } from '../utils/userTransform';

const router = Router();

// List mentors with matching
router.get(
  '/',
  authenticate,
  matchingLimiter,
  validate([
    query('expertise').optional().isString(),
    query('industry').optional().isString(),
    query('available').optional().isBoolean(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('search').optional().isString(),
    query('sortBy').optional().isIn(['matchScore', 'rating', 'availability', 'name']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('favoritesOnly').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const filters: MatchFilters = {};

      if (req.query.expertise) {
        filters.expertise = (req.query.expertise as string).split(',');
      }
      if (req.query.industry) {
        filters.industry = (req.query.industry as string).split(',');
      }
      if (req.query.available === 'true') {
        filters.available = true;
      }
      if (req.query.minRating) {
        filters.minRating = parseFloat(req.query.minRating as string);
      }

      let matches = await matchingService.getMatchesForMentee(userId, filters);

      // Apply search filter
      if (req.query.search) {
        const searchTerm = (req.query.search as string).toLowerCase();
        matches = matches.filter(
          (match) =>
            match.mentor.name?.toLowerCase().includes(searchTerm) ||
            match.mentor.bio?.toLowerCase().includes(searchTerm) ||
            match.mentor.expertiseAreas.some((area) => area.toLowerCase().includes(searchTerm)) ||
            match.reasoning?.toLowerCase().includes(searchTerm)
        );
      }

      // Filter favorites only if requested
      if (req.query.favoritesOnly === 'true') {
        const favoriteMentorIds = await prisma.favoriteMentor.findMany({
          where: { menteeId: userId },
          select: { mentorId: true },
        });
        const favoriteIds = new Set(favoriteMentorIds.map((f: { mentorId: string }) => f.mentorId));
        matches = matches.filter((match) => favoriteIds.has(match.mentorId));
      }

      // Apply sorting - support both 'sort' and 'sortBy' query params
      const sortBy = (req.query.sortBy as string) || (req.query.sort as string) || 'matchScore';
      const sortOrder = (req.query.sortOrder as string) || (req.query.order as string) || 'desc';

      matches.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'matchScore':
            aValue = a.matchScore;
            bValue = b.matchScore;
            break;
          case 'rating':
            aValue = a.averageRating || 0;
            bValue = b.averageRating || 0;
            break;
          case 'availability':
            aValue = a.availableSlots?.length || 0;
            bValue = b.availableSlots?.length || 0;
            break;
          case 'name':
            aValue = a.mentor.name || '';
            bValue = b.mentor.name || '';
            break;
          default:
            aValue = a.matchScore;
            bValue = b.matchScore;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Get favorite status for each mentor
      const favoriteMentorIds = await prisma.favoriteMentor.findMany({
        where: { menteeId: userId },
        select: { mentorId: true },
      });
      const favoriteIds = new Set(favoriteMentorIds.map((f: { mentorId: string }) => f.mentorId));

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const start = (page - 1) * limit;
      const end = start + limit;

      // Transform matches to the format expected by frontend
      const paginatedMatches = matches.slice(start, end).map((match) => {
        // Get mentor's industry focus from database if not in match
        const mentor = match.mentor;
        return {
          id: match.mentorId,
          profile: {
            name: mentor.name || '',
            bio: mentor.bio || '',
            profilePictureUrl: mentor.profilePictureUrl || '',
            expertiseAreas: mentor.expertiseAreas || [],
            industryFocus: mentor.industryFocus || [],
          },
          matchScore: match.matchScore,
          matchReasoning: match.reasoning,
          availableSlots: match.availableSlots?.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          })) || [],
          averageRating: match.averageRating,
          totalSessions: match.totalSessions || 0,
        };
      });

      res.json({
        success: true,
        data: {
          items: paginatedMatches,
          pagination: {
            page,
            limit,
            total: matches.length,
            totalPages: Math.ceil(matches.length / limit),
            hasNext: end < matches.length,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get mentor details
router.get('/:id', authenticate, async (req, res, next): Promise<void> => {
  try {
    const mentor = await userService.getUserById(req.params.id);
    if (mentor.role !== 'mentor') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Mentor not found' },
      });
      return;
    }

    // Get mentor stats
    const [sessions, feedback] = await Promise.all([
      prisma.session.count({
        where: { mentorId: mentor.id, status: 'completed' },
      }),
      prisma.feedback.findMany({
        where: { mentorId: mentor.id },
        select: { rating: true },
      }),
    ]);

    const averageRating =
      feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : null;

    // Transform to frontend format
    const transformedMentor = transformUserToFrontendFormat(mentor);

    // Return in Mentor format expected by frontend
    res.json({
      success: true,
      data: {
        id: transformedMentor.id,
        profile: transformedMentor.profile,
        averageRating,
        totalSessions: sessions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get mentor availability
router.get('/:id/availability', authenticate, async (req, res, next) => {
  try {
    const availability = await prisma.availability.findMany({
      where: { mentorId: req.params.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Convert availability to TimeSlot format with actual dates
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const timeSlots: Array<{ startTime: string; endTime: string }> = [];
    const upcomingSessions = await prisma.session.findMany({
      where: {
        mentorId: req.params.id,
        status: { in: ['pending', 'confirmed'] },
        scheduledAt: { gte: now },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    for (const avail of availability) {
      if (!avail.isRecurring) continue;
      
      const dayOfWeek = avail.dayOfWeek;
      const [startHour, startMin] = avail.startTime.split(':').map(Number);
      const [endHour, endMin] = avail.endTime.split(':').map(Number);

      let currentDate = new Date(now);
      while (currentDate <= twoWeeksLater && timeSlots.length < 10) {
        if (currentDate.getDay() === dayOfWeek) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(startHour, startMin, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(endHour, endMin, 0, 0);

          // Check if slot conflicts with existing sessions
          const hasConflict = upcomingSessions.some((session) => {
            const sessionEnd = new Date(session.scheduledAt);
            sessionEnd.setMinutes(sessionEnd.getMinutes() + session.durationMinutes);
            return (
              (slotStart >= session.scheduledAt && slotStart < sessionEnd) ||
              (slotEnd > session.scheduledAt && slotEnd <= sessionEnd) ||
              (slotStart <= session.scheduledAt && slotEnd >= sessionEnd)
            );
          });

          if (!hasConflict && slotStart > now) {
            timeSlots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    res.json({
      success: true,
      data: { availability: timeSlots },
    });
  } catch (error) {
    next(error);
  }
});

// Set mentor availability (mentor only)
router.post(
  '/:id/availability',
  authenticate,
  authorize('mentor'),
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      if (req.params.id !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      const { dayOfWeek, startTime, endTime, timezone, isRecurring, validFrom, validUntil } =
        req.body;

      const availability = await prisma.availability.create({
        data: {
          mentorId: req.params.id,
          dayOfWeek,
          startTime,
          endTime,
          timezone: timezone || 'UTC',
          isRecurring: isRecurring !== false,
          validFrom: new Date(validFrom),
          validUntil: validUntil ? new Date(validUntil) : null,
        },
      });

      res.json({
        success: true,
        data: { availability },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get matches for mentor (mentor only)
router.get('/:id/matches', authenticate, authorize('mentor'), async (req: AuthRequest, res, next): Promise<void> => {
  try {
    if (req.params.id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    const matches = await matchingService.getMatchesForMentor(req.params.id);

    res.json({
      success: true,
      data: { matches },
    });
  } catch (error) {
    next(error);
  }
});

// Bulk availability management (mentor only)
router.post(
  '/:id/availability/bulk',
  authenticate,
  authorize('mentor'),
  validate([
    body('availability').isArray().withMessage('Availability array is required'),
    body('availability.*.dayOfWeek').isInt({ min: 0, max: 6 }),
    body('availability.*.startTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('availability.*.endTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  ]),
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      if (req.params.id !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      const { availability, timezone, isRecurring, validFrom, validUntil, replaceExisting } =
        req.body;

      // If replaceExisting is true, delete all existing availability for this mentor
      if (replaceExisting) {
        await prisma.availability.deleteMany({
          where: { mentorId: req.params.id },
        });
      }

      // Create all availability slots
      const created = await prisma.$transaction(
        availability.map((avail: any) =>
          prisma.availability.create({
            data: {
              mentorId: req.params.id,
              dayOfWeek: avail.dayOfWeek,
              startTime: avail.startTime,
              endTime: avail.endTime,
              timezone: timezone || avail.timezone || 'UTC',
              isRecurring: isRecurring !== false && avail.isRecurring !== false,
              validFrom: validFrom ? new Date(validFrom) : avail.validFrom ? new Date(avail.validFrom) : new Date(),
              validUntil: validUntil ? new Date(validUntil) : avail.validUntil ? new Date(avail.validUntil) : null,
            },
          })
        )
      );

      res.json({
        success: true,
        data: { availability: created, count: created.length },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Favorite/unfavorite mentor (mentee only)
router.post(
  '/:id/favorite',
  authenticate,
  authorize('mentee'),
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      const mentorId = req.params.id;
      const menteeId = req.user!.id;

      // Verify mentor exists
      const mentor = await prisma.user.findUnique({
        where: { id: mentorId },
        select: { id: true, role: true },
      });

      if (!mentor || mentor.role !== 'mentor') {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Mentor not found' },
        });
        return;
      }

      // Check if already favorited
      const existing = await prisma.favoriteMentor.findUnique({
        where: {
          menteeId_mentorId: {
            menteeId,
            mentorId,
          },
        },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE', message: 'Mentor is already in favorites' },
        });
        return;
      }

      const favorite = await prisma.favoriteMentor.create({
        data: {
          menteeId,
          mentorId,
        },
      });

      res.json({
        success: true,
        data: { favorite },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Unfavorite mentor (mentee only)
router.delete(
  '/:id/favorite',
  authenticate,
  authorize('mentee'),
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      const mentorId = req.params.id;
      const menteeId = req.user!.id;

      const favorite = await prisma.favoriteMentor.findUnique({
        where: {
          menteeId_mentorId: {
            menteeId,
            mentorId,
          },
        },
      });

      if (!favorite) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Favorite not found' },
        });
        return;
      }

      await prisma.favoriteMentor.delete({
        where: {
          menteeId_mentorId: {
            menteeId,
            mentorId,
          },
        },
      });

      res.json({
        success: true,
        message: 'Mentor removed from favorites',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

