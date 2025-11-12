import { apiClient } from './client';
import { ApiResponse, Feedback, FeedbackStats } from '@/types';

export interface CreateFeedbackData {
  sessionId: string;
  rating: number;
  writtenFeedback?: string;
  topicsCovered?: string[];
  helpfulnessRating?: number;
  wouldRecommend?: boolean;
  isAnonymous?: boolean;
}

export const feedbackApi = {
  create: async (data: CreateFeedbackData): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>('/feedback', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to submit feedback');
    }
    return response.data;
  },

  getBySessionId: async (sessionId: string): Promise<Feedback> => {
    const response = await apiClient.get<Feedback>(`/feedback/${sessionId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch feedback');
    }
    return response.data;
  },

  getByMentorId: async (mentorId: string): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>(`/mentors/${mentorId}/feedback`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch feedback');
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  getStats: async (mentorId: string): Promise<FeedbackStats> => {
    const response = await apiClient.get<FeedbackStats>(`/feedback/stats/${mentorId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch feedback stats');
    }
    return response.data;
  },
};



