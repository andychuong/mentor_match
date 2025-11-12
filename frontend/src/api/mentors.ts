import { apiClient } from './client';
import { ApiResponse, Mentor, PaginatedResponse, TimeSlot } from '@/types';

export interface MentorFilters {
  expertise?: string[];
  industry?: string[];
  available?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
  sort?: 'matchScore' | 'rating' | 'availability';
  order?: 'asc' | 'desc';
}

export const mentorsApi = {
  list: async (filters?: MentorFilters): Promise<PaginatedResponse<Mentor>> => {
    const params = new URLSearchParams();
    if (filters?.expertise) {
      filters.expertise.forEach((e) => params.append('expertise', e));
    }
    if (filters?.industry) {
      filters.industry.forEach((i) => params.append('industry', i));
    }
    if (filters?.available !== undefined) {
      params.append('available', String(filters.available));
    }
    if (filters?.minRating) {
      params.append('minRating', String(filters.minRating));
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    if (filters?.sort) {
      params.append('sort', filters.sort);
    }
    if (filters?.order) {
      params.append('order', filters.order);
    }

    const response = await apiClient.get<PaginatedResponse<Mentor>>(
      `/mentors?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch mentors');
    }
    return response.data;
  },

  getById: async (id: string): Promise<Mentor> => {
    const response = await apiClient.get<Mentor>(`/mentors/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch mentor');
    }
    return response.data;
  },

  getAvailability: async (
    id: string,
    startDate?: string,
    endDate?: string
  ): Promise<TimeSlot[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<TimeSlot[]>(
      `/mentors/${id}/availability?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch availability');
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  setAvailability: async (id: string, slots: TimeSlot[]): Promise<void> => {
    const response = await apiClient.post(`/mentors/${id}/availability`, { slots });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to set availability');
    }
  },

  getMatches: async (id: string): Promise<Mentor[]> => {
    const response = await apiClient.get<Mentor[]>(`/mentors/${id}/matches`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch matches');
    }
    return Array.isArray(response.data) ? response.data : [];
  },
};

