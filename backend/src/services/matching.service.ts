import { prisma } from '../config/database';
import { AppError, errorCodes } from '../utils/errors';
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
    // Check if matches exist in DB
    const existingMatches = await prisma.match.findMany({
      where: { menteeId },
      include: {
        mentor: {
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
        },
      },
      orderBy: { matchScore: 'desc' },
    });

    let matchesToReturn = existingMatches;

    // If no matches found, generate them
    if (existingMatches.length === 0) {
      matchesToReturn = await this.generateMatches(menteeId);
    }

    // Transform to MatchResult and apply filters
    const results: MatchResult[] = [];

    for (const match of matchesToReturn) {
      // @ts-ignore - Prisma include types can be tricky, but we know mentor is included
      const mentor = match.mentor;

      // Apply filters
      if (filters?.expertise && filters.expertise.length > 0) {
        const hasExpertise = filters.expertise.some((exp) =>
          mentor.expertiseAreas.includes(exp)
        );
        if (!hasExpertise) continue;
      }

      if (filters?.industry && filters.industry.length > 0) {
        // Note: The original logic filtered by mentee industry focus vs mentor expertise.
        // Here we are filtering the *results* based on the user's filter criteria.
        // Let's stick to filtering by mentor attributes as that's what the UI usually does.
        const hasIndustryMatch = filters.industry.some((ind) =>
          mentor.industryFocus.includes(ind) || mentor.expertiseAreas.includes(ind)
        );
        if (!hasIndustryMatch) continue;
      }

      // Calculate average rating
      const averageRating =
        mentor.mentorFeedback.length > 0
          ? mentor.mentorFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) /
          mentor.mentorFeedback.length
          : undefined;

      if (filters?.minRating && averageRating && averageRating < filters.minRating) {
        continue;
      }

      // Get available slots if requested
      let availableSlots: Array<{ startTime: string; endTime: string }> | undefined;
      if (filters?.available) {
        availableSlots = await this.getAvailableSlots(mentor.id);
        if (availableSlots.length === 0) continue;
      }

      results.push({
        mentorId: mentor.id,
        mentor: {
          id: mentor.id,
          name: mentor.name || mentor.email,
          profilePictureUrl: mentor.profilePictureUrl || undefined,
          expertiseAreas: mentor.expertiseAreas,
          industryFocus: mentor.industryFocus,
          bio: mentor.bio || undefined,
        },
        matchScore: match.matchScore,
        reasoning: match.reasoning || '',
        availableSlots,
        averageRating,
        totalSessions: mentor.mentorSessions.length,
      });

      // If we have enough results, stop
      if (filters?.limit && results.length >= filters.limit) {
        break;
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  async generateMatches(menteeId: string): Promise<any[]> {
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

    const matchesToSave: any[] = [];

    for (const mentor of mentors) {
      const matchScore = this.calculateMatchScore(mentee, mentor);

      // Only save matches with a score > 0 or some threshold? 
      // For now, save all to allow filtering, or maybe top 50?
      // Let's save all for now as the user base is likely small.

      // Generate AI reasoning only for top matches (e.g. score > 70) to save tokens
      let reasoning = '';
      if (matchScore > 60) {
        try {
          reasoning = await aiService.generateMatchReasoning(mentee, mentor, matchScore);
        } catch (e) {
          console.error('Failed to generate AI reasoning', e);
        }
      }

      matchesToSave.push({
        menteeId,
        mentorId: mentor.id,
        matchScore,
        reasoning,
      });
    }

    // Delete existing matches
    await prisma.match.deleteMany({
      where: { menteeId },
    });

    // Bulk create new matches
    // Prisma doesn't support createMany with relations easily in one go if we need to return them with includes
    // So we'll use a transaction

    await prisma.match.createMany({
      data: matchesToSave,
    });

    // Return the newly created matches with mentor details
    return prisma.match.findMany({
      where: { menteeId },
      include: {
        mentor: {
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
        },
      },
      orderBy: { matchScore: 'desc' },
    });
  }

  private calculateMatchScore(mentee: MenteeProfile, mentor: MentorProfile): number {
    let score = 0;

    const menteeIndustries = mentee.industryFocus || [];
    const mentorExpertise = mentor.expertiseAreas || [];
    const mentorIndustries = mentor.industryFocus || [];

    // Industry Focus Match (35%) - Compare mentee industries with mentor industries
    const industryMatch = this.calculateSmartOverlap(menteeIndustries, mentorIndustries);
    score += industryMatch * 0.35;

    // Expertise Match (35%) - Compare mentee industries/needs with mentor expertise areas
    const expertiseMatch = this.calculateSmartOverlap(menteeIndustries, mentorExpertise);
    score += expertiseMatch * 0.35;

    // Stage Relevance (20%) - Check if mentor has expertise relevant to startup stage
    let stageScore = 0;
    if (mentee.startupStage) {
      // Check for relevant stage keywords in expertise
      const stageKeywords = this.getStageKeywords(mentee.startupStage);
      const hasStageExpertise = mentorExpertise.some(exp =>
        stageKeywords.some(keyword => exp.toLowerCase().includes(keyword))
      );

      if (hasStageExpertise) {
        stageScore = 0.2;
      } else {
        // General business expertise is still somewhat relevant
        const generalExpertise = ['Startup Strategy', 'Business Development', 'Fundraising', 'Product Management'];
        const hasGeneralExpertise = mentorExpertise.some(exp => generalExpertise.includes(exp));
        stageScore = hasGeneralExpertise ? 0.12 : 0.05;
      }
    } else {
      stageScore = 0.1; // Neutral score if no stage specified
    }
    score += stageScore;

    // Availability & Activity Bonus (10%)
    score += 0.1; // Assume mentor is available

    // Ensure minimum score of 0.3 and maximum of 0.95 for realistic distribution
    const finalScore = Math.max(0.3, Math.min(0.95, score));

    return Math.round(finalScore * 100);
  }

  private getStageKeywords(stage: string): string[] {
    const stageMap: Record<string, string[]> = {
      'pre-seed': ['fundraising', 'angel', 'pre-seed', 'startup strategy', 'mvp', 'validation'],
      'seed': ['fundraising', 'seed', 'venture', 'growth', 'go-to-market', 'product-market fit'],
      'early': ['scaling', 'growth', 'team building', 'hiring', 'series a', 'go-to-market'],
      'growth': ['scaling', 'growth hacking', 'series b', 'expansion', 'operations'],
      'late': ['scaling', 'enterprise', 'operations', 'ipo', 'acquisition'],
    };
    return stageMap[stage.toLowerCase()] || ['startup', 'business'];
  }

  private calculateOverlap(array1: string[], array2: string[]): number {
    if (array1.length === 0 || array2.length === 0) return 0;
    const intersection = array1.filter((item) => array2.includes(item));
    return intersection.length / Math.max(array1.length, array2.length);
  }

  private calculateSmartOverlap(array1: string[], array2: string[]): number {
    if (array1.length === 0 || array2.length === 0) return 0;

    let matchScore = 0;
    let totalComparisons = 0;

    // Check for exact and partial matches
    for (const item1 of array1) {
      for (const item2 of array2) {
        totalComparisons++;

        // Exact match
        if (item1.toLowerCase() === item2.toLowerCase()) {
          matchScore += 1.0;
        }
        // Partial match (one contains the other or shared words)
        else if (
          item1.toLowerCase().includes(item2.toLowerCase()) ||
          item2.toLowerCase().includes(item1.toLowerCase())
        ) {
          matchScore += 0.7;
        }
        // Check for shared significant words
        else {
          const words1 = item1.toLowerCase().split(/[\s/\-]+/);
          const words2 = item2.toLowerCase().split(/[\s/\-]+/);
          const sharedWords = words1.filter(w =>
            w.length > 3 && words2.some(w2 => w2.includes(w) || w.includes(w2))
          );
          if (sharedWords.length > 0) {
            matchScore += 0.4 * (sharedWords.length / Math.max(words1.length, words2.length));
          }
        }
      }
    }

    // Normalize by the expected maximum possible score
    const maxPossibleScore = Math.max(array1.length, array2.length);
    return Math.min(1.0, matchScore / maxPossibleScore);
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

