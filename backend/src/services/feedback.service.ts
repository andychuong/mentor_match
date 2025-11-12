import { prisma } from '../config/database';
import { AppError, errorCodes } from '../utils/errors';

export interface CreateFeedbackData {
  sessionId: string;
  mentorId: string;
  menteeId: string;
  rating: number;
  writtenFeedback?: string;
  topicsCovered?: string[];
  helpfulnessRating: number;
  wouldRecommend: boolean;
  isAnonymous?: boolean;
}

export class FeedbackService {
  async createFeedback(data: CreateFeedbackData) {
    const { sessionId, mentorId, menteeId, rating, helpfulnessRating } = data;

    // Validate ratings
    if (rating < 1 || rating > 5) {
      throw new AppError(422, errorCodes.VALIDATION_ERROR, 'Rating must be between 1 and 5');
    }

    if (helpfulnessRating < 1 || helpfulnessRating > 5) {
      throw new AppError(422, errorCodes.VALIDATION_ERROR, 'Helpfulness rating must be between 1 and 5');
    }

    // Verify session exists and is completed
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
    }

    if (session.status !== 'completed') {
      throw new AppError(422, errorCodes.VALIDATION_ERROR, 'Feedback can only be submitted for completed sessions');
    }

    if (session.mentorId !== mentorId || session.menteeId !== menteeId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Invalid session participants');
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { sessionId },
    });

    if (existingFeedback) {
      throw new AppError(409, errorCodes.VALIDATION_ERROR, 'Feedback already submitted for this session');
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        sessionId,
        mentorId,
        menteeId,
        rating,
        writtenFeedback: data.writtenFeedback,
        topicsCovered: data.topicsCovered || [],
        helpfulnessRating,
        wouldRecommend: data.wouldRecommend,
        isAnonymous: data.isAnonymous || false,
      },
      include: {
        session: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                profilePictureUrl: true,
              },
            },
            mentee: {
              select: {
                id: true,
                name: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    return feedback;
  }

  async getFeedbackBySession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
    }

    if (session.mentorId !== userId && session.menteeId !== userId) {
      throw new AppError(403, errorCodes.FORBIDDEN, 'Access denied');
    }

    const feedback = await prisma.feedback.findUnique({
      where: { sessionId },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Feedback not found');
    }

    return feedback;
  }

  async getMentorFeedback(mentorId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { mentorId },
        skip,
        take: limit,
        include: {
          session: {
            include: {
              mentee: {
                select: {
                  id: true,
                  name: true,
                  profilePictureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feedback.count({ where: { mentorId } }),
    ]);

    return {
      feedback,
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

  async getFeedbackStats(mentorId: string) {
    const feedback = await prisma.feedback.findMany({
      where: { mentorId },
      select: {
        rating: true,
        helpfulnessRating: true,
        wouldRecommend: true,
      },
    });

    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        averageHelpfulness: 0,
        recommendationRate: 0,
      };
    }

    const averageRating =
      feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    const averageHelpfulness =
      feedback.reduce((sum, f) => sum + f.helpfulnessRating, 0) / feedback.length;
    const recommendationRate =
      feedback.filter((f) => f.wouldRecommend).length / feedback.length;

    return {
      totalFeedback: feedback.length,
      averageRating: Math.round(averageRating * 10) / 10,
      averageHelpfulness: Math.round(averageHelpfulness * 10) / 10,
      recommendationRate: Math.round(recommendationRate * 100) / 100,
    };
  }
}

export const feedbackService = new FeedbackService();

