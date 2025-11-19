import { prisma } from '../config/database';
import { AppError, errorCodes } from '../utils/errors';
import { notificationService } from './notification.service';
import { calendarIntegrationService } from './calendarIntegration.service';
import logger from '../utils/logger';

export interface CreateSessionData {
  mentorId: string;
  menteeId: string;
  scheduledAt: string; // ISO 8601
  durationMinutes?: number;
  topic?: string;
  notes?: string;
}

export interface UpdateSessionData {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledAt?: string;
  topic?: string;
  notes?: string;
  mentorNotes?: string;
  menteeNotes?: string;
}

export class SessionService {
  async createSession(data: CreateSessionData) {
    const { mentorId, menteeId, scheduledAt, durationMinutes = 60, topic, notes } = data;

    // Verify mentor and mentee exist
    const [mentor, mentee] = await Promise.all([
      prisma.user.findUnique({ where: { id: mentorId } }),
      prisma.user.findUnique({ where: { id: menteeId } }),
    ]);

    if (!mentor || mentor.role !== 'mentor') {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Mentor not found');
    }

    if (!mentee || mentee.role !== 'mentee') {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Mentee not found');
    }

    // Check for conflicts
    const scheduledDateTime = new Date(scheduledAt);
    const sessionEnd = new Date(scheduledDateTime);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + durationMinutes);

    // Get all conflicting sessions - we'll check overlap manually
    const existingSessions = await prisma.session.findMany({
      where: {
        mentorId,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    // More precise conflict detection
    const hasConflict = existingSessions.some((session) => {
      const existingStart = new Date(session.scheduledAt);
      const existingEnd = new Date(existingStart);
      existingEnd.setMinutes(existingEnd.getMinutes() + session.durationMinutes);

      return (
        (scheduledDateTime >= existingStart && scheduledDateTime < existingEnd) ||
        (sessionEnd > existingStart && sessionEnd <= existingEnd) ||
        (scheduledDateTime <= existingStart && sessionEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      throw new AppError(409, errorCodes.SESSION_CONFLICT, 'Session time conflicts with existing session');
    }

    // Get match score if available
    const matchScore = await this.getMatchScore(menteeId, mentorId);

    // Create session
    const session = await prisma.session.create({
      data: {
        mentorId,
        menteeId,
        scheduledAt: scheduledDateTime,
        durationMinutes,
        topic,
        notes,
        status: 'pending',
        matchScore,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Send notification to mentor
    notificationService.createNotification({
      userId: mentorId,
      type: 'session_request',
      title: 'New Session Request',
      message: `${mentee.name || mentee.email} has requested a session with you.`,
      metadata: { sessionId: session.id },
    }).catch(console.error);

    // Sync to calendars (async, don't block)
    calendarIntegrationService.syncSessionToCalendar(session.id).catch((error) => {
      logger.error(`Failed to sync session ${session.id} to calendar:`, error);
    });

    return session;
  }

  async getSession(sessionId: string, userId: string, role?: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
            expertiseAreas: true,
            bio: true,
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
            industryFocus: true,
            startupStage: true,
          },
        },
        feedback: true,
      },
    });

    if (!session) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
    }

    // Admin can access any session
    if (role === 'admin') {
      return session;
    }

    // Check if user has access
    if (session.mentorId !== userId && session.menteeId !== userId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Access denied');
    }

    return session;
  }

  async getSessions(filters: {
    userId: string;
    role: string;
    status?: string;
    mentorId?: string;
    menteeId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: {
      mentorId?: string;
      menteeId?: string;
      status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    } = {};

    // Admin can see all sessions (no userId filter)
    if (filters.role === 'mentor') {
      where.mentorId = filters.userId;
    } else if (filters.role === 'mentee') {
      where.menteeId = filters.userId;
    }
    // For admin role, no userId filter is applied - they see all sessions

    if (filters.status) {
      where.status = filters.status as 'pending' | 'confirmed' | 'completed' | 'cancelled';
    }

    if (filters.mentorId) {
      where.mentorId = filters.mentorId;
    }

    if (filters.menteeId) {
      where.menteeId = filters.menteeId;
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: limit,
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          feedback: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.session.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async updateSession(sessionId: string, userId: string, data: UpdateSessionData) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
    }

    // Check permissions
    if (session.mentorId !== userId && session.menteeId !== userId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Access denied');
    }

    // Only mentor can confirm/decline
    if (data.status && ['confirmed', 'cancelled'].includes(data.status)) {
      if (session.mentorId !== userId) {
        throw new AppError(403, errorCodes.FORBIDDEN, 'Only mentor can confirm or cancel sessions');
      }
    }

    // Only mentor can update mentorNotes, only mentee can update menteeNotes
    if (data.mentorNotes !== undefined && session.mentorId !== userId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Only mentor can update mentor notes');
    }
    if (data.menteeNotes !== undefined && session.menteeId !== userId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Only mentee can update mentee notes');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: data.status,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        topic: data.topic,
        notes: data.notes,
        mentorNotes: data.mentorNotes,
        menteeNotes: data.menteeNotes,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Send notifications
    if (data.status === 'confirmed') {
      notificationService.createNotification({
        userId: session.menteeId,
        type: 'session_confirmation',
        title: 'Session Confirmed',
        message: `Your session with ${updatedSession.mentor.name || updatedSession.mentor.email} has been confirmed.`,
        metadata: { sessionId: updatedSession.id },
      }).catch(console.error);

      // Sync to calendars when confirmed
      calendarIntegrationService.syncSessionToCalendar(updatedSession.id).catch((error) => {
        logger.error(`Failed to sync session ${updatedSession.id} to calendar:`, error);
      });
    } else if (data.status === 'cancelled') {
      const otherUserId = session.mentorId === userId ? session.menteeId : session.mentorId;
      notificationService.createNotification({
        userId: otherUserId,
        type: 'session_cancellation',
        title: 'Session Cancelled',
        message: 'A session has been cancelled.',
        metadata: { sessionId: updatedSession.id },
      }).catch(console.error);

      // Delete from calendars when cancelled
      calendarIntegrationService.deleteSessionFromCalendar(updatedSession.id).catch((error) => {
        logger.error(`Failed to delete session ${updatedSession.id} from calendar:`, error);
      });
    } else if (data.scheduledAt || data.topic || data.notes) {
      // Update calendar if time or details changed
      calendarIntegrationService.syncSessionToCalendar(updatedSession.id).catch((error) => {
        logger.error(`Failed to sync session ${updatedSession.id} to calendar:`, error);
      });
    }

    return updatedSession;
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
    }

    // Only mentee can cancel pending sessions, or either party can cancel their own
    if (session.status !== 'pending' && session.mentorId !== userId && session.menteeId !== userId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Access denied');
    }

    // Delete from calendars before deleting session
    calendarIntegrationService.deleteSessionFromCalendar(sessionId).catch((error) => {
      logger.error(`Failed to delete session ${sessionId} from calendar:`, error);
    });

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }

  private async getMatchScore(_menteeId: string, _mentorId: string): Promise<number | null> {
    // Try to get from cache
    // const cacheKey = `match:${_menteeId}:${_mentorId}`;
    // This would be implemented with Redis or similar
    // For now, return null
    return null;
  }
}

export const sessionService = new SessionService();

