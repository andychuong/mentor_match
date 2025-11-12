import { prisma } from '../config/database';
import { AppError, errorCodes } from '../utils/errors';
import { redis } from '../config/redis';
import { aiService } from './ai.service';
import { MatchFilters, MenteeProfile, MentorProfile } from '../types';

export interface MatchResult {
  mentorId: string;
  mentor: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    expertiseAreas: string[];
    industryFocus?: string[];
    bio?: string;
  };
  matchScore: number;
  reasoning: string;
  availableSlots?: Array<{
    startTime: string;
    endTime: string;
  }>;
  averageRating?: number;
  totalSessions?: number;
}

export class MatchingService {
  async getMatchesForMentee(menteeId: string, filters?: MatchFilters): Promise<MatchResult[]> {
    // Get mentee profile
    const mentee = await prisma.user.findUnique({
      where: { id: menteeId },
      select: {
        id: true,
        industryFocus: true,
        startupStage: true,
      },
    });

    if (!mentee) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Mentee not found');
    }

    // Get all active mentors
    const mentors = await prisma.user.findMany({
      where: {
        role: 'mentor',
        isActive: true,
      },
      include: {
        mentorFeedback: {
          select: {
            rating: true,
            helpfulnessRating: true,
          },
        },
        mentorSessions: {
          where: {
            status: 'completed',
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate matches
    const matches: MatchResult[] = [];

    for (const mentor of mentors) {
      // Check cache first
      const cacheKey = `match:${menteeId}:${mentor.id}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const cachedMatch = JSON.parse(cached);
        if (new Date(cachedMatch.expiresAt) > new Date()) {
          matches.push(cachedMatch);
          continue;
        }
      }

      // Calculate match score
      const matchScore = this.calculateMatchScore(mentee, mentor);

      // Apply filters
      if (filters?.expertise && filters.expertise.length > 0) {
        const hasExpertise = filters.expertise.some((exp) =>
          mentor.expertiseAreas.includes(exp)
        );
        if (!hasExpertise) continue;
      }

      if (filters?.industry && filters.industry.length > 0) {
        const hasIndustry = filters.industry.some((ind) =>
          mentee.industryFocus.includes(ind)
        );
        if (!hasIndustry) continue;
      }

      // Calculate average rating
      const averageRating =
        mentor.mentorFeedback.length > 0
          ? mentor.mentorFeedback.reduce((sum, f) => sum + f.rating, 0) /
            mentor.mentorFeedback.length
          : undefined;

      if (filters?.minRating && averageRating && averageRating < filters.minRating) {
        continue;
      }

      // Get AI reasoning
      const reasoning = await aiService.generateMatchReasoning(mentee, mentor, matchScore);

      // Get available slots if requested
      let availableSlots: Array<{ startTime: string; endTime: string }> | undefined;
      if (filters?.available) {
        availableSlots = await this.getAvailableSlots(mentor.id);
        if (availableSlots.length === 0) continue;
      }

      const match: MatchResult = {
        mentorId: mentor.id,
        mentor: {
          id: mentor.id,
          name: mentor.name || mentor.email,
          profilePictureUrl: mentor.profilePictureUrl || undefined,
          expertiseAreas: mentor.expertiseAreas,
          industryFocus: mentor.industryFocus,
          bio: mentor.bio || undefined,
        },
        matchScore,
        reasoning,
        availableSlots,
        averageRating,
        totalSessions: mentor.mentorSessions.length,
      };

      matches.push(match);

      // Cache the match (expires in 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      await redis.setex(cacheKey, 3600, JSON.stringify({ ...match, expiresAt }));
    }

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  private calculateMatchScore(mentee: MenteeProfile, mentor: MentorProfile): number {
    let score = 0;

    // Expertise match (40%)
    const menteeNeeds = mentee.industryFocus || [];
    const mentorExpertise = mentor.expertiseAreas || [];
    const expertiseMatch = this.calculateOverlap(menteeNeeds, mentorExpertise);
    score += expertiseMatch * 0.4;

    // Industry match (30%)
    const industryMatch = this.calculateOverlap(menteeNeeds, mentorExpertise);
    score += industryMatch * 0.3;

    // Stage relevance (20%) - simplified, could be enhanced
    if (mentee.startupStage && (mentor.expertiseAreas || []).includes(mentee.startupStage)) {
      score += 0.2;
    } else {
      score += 0.1; // Partial match
    }

    // Availability (10%) - simplified
    score += 0.1; // Assume available for now

    return Math.round(score * 100);
  }

  private calculateOverlap(array1: string[], array2: string[]): number {
    if (array1.length === 0 || array2.length === 0) return 0;
    const intersection = array1.filter((item) => array2.includes(item));
    return intersection.length / Math.max(array1.length, array2.length);
  }

  private async getAvailableSlots(mentorId: string): Promise<Array<{ startTime: string; endTime: string }>> {
    // Get mentor availability
    const availability = await prisma.availability.findMany({
      where: {
        mentorId,
        isRecurring: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
    });

    // Get upcoming sessions
    const upcomingSessions = await prisma.session.findMany({
      where: {
        mentorId,
        status: { in: ['pending', 'confirmed'] },
        scheduledAt: { gte: new Date() },
      },
      select: {
        scheduledAt: true,
        durationMinutes: true,
      },
    });

    // Generate available slots for next 2 weeks
    const slots: Array<{ startTime: string; endTime: string }> = [];
    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    for (const avail of availability) {
      const dayOfWeek = avail.dayOfWeek;
      const [startHour, startMin] = avail.startTime.split(':').map(Number);
      const [endHour, endMin] = avail.endTime.split(':').map(Number);

      let currentDate = new Date(now);
      while (currentDate <= twoWeeksLater) {
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
            slots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return slots.slice(0, 10); // Limit to 10 slots
  }

  async getMatchesForMentor(mentorId: string): Promise<Array<{
    menteeId: string;
    mentee: {
      id: string;
      name: string | null;
      profilePictureUrl: string | null;
      industryFocus: string[];
      startupStage: string | null;
    };
    matchScore: number;
  }>> {
    // Get all active mentees
    const mentees = await prisma.user.findMany({
      where: {
        role: 'mentee',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilePictureUrl: true,
        industryFocus: true,
        startupStage: true,
      },
    });

    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: {
        id: true,
        email: true,
        name: true,
        expertiseAreas: true,
      },
    });

    if (!mentor) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Mentor not found');
    }

    const matches = mentees.map((mentee) => {
      const matchScore = this.calculateMatchScore(mentee, mentor);
      return {
        menteeId: mentee.id,
        mentee: {
          id: mentee.id,
          name: mentee.name || mentee.email,
          profilePictureUrl: mentee.profilePictureUrl || null,
          industryFocus: mentee.industryFocus,
          startupStage: mentee.startupStage,
        },
        matchScore,
      };
    });

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getMatchExplanation(mentee: MenteeProfile, mentor: MentorProfile): Promise<{
    matchScore: number;
    reasoning: string;
    breakdown: {
      expertiseMatch: number;
      industryMatch: number;
      stageRelevance: number;
      availability: number;
    };
  }> {
    const matchScore = this.calculateMatchScore(mentee, mentor);
    
    // Calculate breakdown
    const menteeNeeds = mentee.industryFocus || [];
    const mentorExpertise = mentor.expertiseAreas || [];
    const expertiseMatch = this.calculateOverlap(menteeNeeds, mentorExpertise);
    const industryMatch = this.calculateOverlap(menteeNeeds, mentorExpertise);
    const stageRelevance = mentee.startupStage && (mentor.expertiseAreas || []).includes(mentee.startupStage) ? 1 : 0.5;
    const availability = 1; // Assume available for now

    const breakdown = {
      expertiseMatch: Math.round(expertiseMatch * 100),
      industryMatch: Math.round(industryMatch * 100),
      stageRelevance: Math.round(stageRelevance * 100),
      availability: Math.round(availability * 100),
    };

    // Get AI reasoning
    const reasoning = await aiService.generateMatchReasoning(mentee, mentor, matchScore);

    return {
      matchScore,
      reasoning,
      breakdown,
    };
  }
}

export const matchingService = new MatchingService();

