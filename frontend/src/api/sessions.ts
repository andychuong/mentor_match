import { apiClient } from './client';
import { ApiResponse, Session, PaginatedResponse } from '@/types';

export interface SessionFilters {
  status?: string;
  mentorId?: string;
  menteeId?: string;
  page?: number;
  limit?: number;
}

export interface CreateSessionData {
  mentorId: string;
  scheduledAt: string;
  topic: string;
  notes?: string;
}

export interface UpdateSessionData {
  status?: string;
  scheduledAt?: string;
  topic?: string;
  notes?: string;
}

export const sessionsApi = {
  list: async (filters?: SessionFilters): Promise<PaginatedResponse<Session>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.mentorId) params.append('mentorId', filters.mentorId);
    if (filters?.menteeId) params.append('menteeId', filters.menteeId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<PaginatedResponse<Session>>(
      `/sessions?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch sessions');
    }
    return response.data;
  },

  getById: async (id: string): Promise<Session> => {
    const response = await apiClient.get<Session>(`/sessions/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch session');
    }
    return response.data;
  },

  create: async (data: CreateSessionData): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    return response.data;
  },

  update: async (id: string, data: UpdateSessionData): Promise<Session> => {
    const response = await apiClient.put<Session>(`/sessions/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update session');
    }
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/sessions/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel session');
    }
  },
};

