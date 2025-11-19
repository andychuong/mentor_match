import { Router } from 'express';
import { query } from 'express-validator';
import { matchingService } from '../services/matching.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { matchingLimiter } from '../middleware/rateLimiter';
import { prisma } from '../config/database';
import { AppError, errorCodes } from '../utils/errors';
import { MenteeProfile, MentorProfile } from '../types';

const router = Router();

// Get match explanation
// matchId can be either a session ID or we use menteeId + mentorId
router.get(
  '/explain/:matchId',
  authenticate,
  matchingLimiter,
  validate([
    query('mentorId').optional().isUUID(),
  ]),
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      const matchId = req.params.matchId;
      const mentorId = req.query.mentorId as string | undefined;
      const menteeId = req.user!.id;

      // Try to find as session ID first
      const session = await prisma.session.findUnique({
        where: { id: matchId },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              expertiseAreas: true,
              bio: true,
            },
          },
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
              industryFocus: true,
              startupStage: true,
            },
          },
        },
      });

      if (session) {
        // If session found, use its mentor and mentee
        if (session.menteeId !== menteeId && req.user!.role !== 'admin') {
          throw new AppError(403, errorCodes.FORBIDDEN, 'Access denied');
        }

        // Get match explanation
        const matches = await matchingService.getMatchesForMentee(session.menteeId);
        const match = matches.find((m) => m.mentorId === session.mentorId);

        if (!match) {
          // Calculate match on the fly if not in cache
          const mentee = await prisma.user.findUnique({
            where: { id: session.menteeId },
            select: {
              id: true,
              industryFocus: true,
              startupStage: true,
            },
          });

          const mentor = await prisma.user.findUnique({
            where: { id: session.mentorId },
            select: {
              id: true,
              name: true,
              email: true,
              expertiseAreas: true,
              bio: true,
            },
          });

          if (!mentee || !mentor) {
            throw new AppError(404, errorCodes.NOT_FOUND, 'User not found');
          }

          const explanation = await matchingService.getMatchExplanation(
            mentee as MenteeProfile,
            mentor as MentorProfile
          );

          res.json({
            success: true,
            data: {
              matchId: session.id,
              mentorId: session.mentorId,
              menteeId: session.menteeId,
              matchScore: session.matchScore || null,
              reasoning: explanation.reasoning,
              breakdown: explanation.breakdown,
            },
          });
          return;
        }

        if (match) {
          res.json({
            success: true,
            data: {
              matchId: session.id,
              mentorId: session.mentorId,
              menteeId: session.menteeId,
              matchScore: match.matchScore,
              reasoning: match.reasoning,
            },
          });
          return;
        }

        // Fallback if match is still undefined (shouldn't happen but TypeScript needs this)
        throw new AppError(500, errorCodes.INTERNAL_ERROR, 'Failed to calculate match');
      }

      // If not a session ID, treat as mentor ID (with menteeId from auth)
      if (!mentorId) {
        throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Mentor ID is required when matchId is not a session ID');
      }

      const mentee = await prisma.user.findUnique({
        where: { id: menteeId },
        select: {
          id: true,
          industryFocus: true,
          startupStage: true,
        },
      });

      const mentor = await prisma.user.findUnique({
        where: { id: mentorId },
        select: {
          id: true,
          name: true,
          email: true,
          expertiseAreas: true,
          bio: true,
        },
      });

      if (!mentee || !mentor) {
        throw new AppError(404, errorCodes.NOT_FOUND, 'User not found');
      }

      const explanation = await matchingService.getMatchExplanation(
        mentee as MenteeProfile,
        mentor as MentorProfile
      );

      res.json({
        success: true,
        data: {
          mentorId,
          menteeId,
          matchScore: explanation.matchScore,
          reasoning: explanation.reasoning,
          breakdown: explanation.breakdown,
        },
      });
      return;
    } catch (error) {
      next(error);
    }
  }
);

// Refresh matches
router.post(
  '/refresh',
  authenticate,
  matchingLimiter,
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      const userId = req.user!.id;

      // Only mentees can refresh matches
      if (req.user!.role !== 'mentee') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only mentees can refresh matches' },
        });
        return;
      }

      const matches = await matchingService.generateMatches(userId);

      res.json({
        success: true,
        data: {
          count: matches.length,
          message: 'Matches refreshed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

