import { apiClient } from './client';
import { ApiResponse, Analytics, User, Session, PaginatedResponse } from '@/types';

export interface AdminFilters {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
}

export const adminApi = {
  getAnalytics: async (): Promise<Analytics> => {
    const response = await apiClient.get<Analytics>('/admin/analytics');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch analytics');
    }
    return response.data;
  },

  getSessionAnalytics: async (): Promise<Analytics> => {
    const response = await apiClient.get<Analytics>('/admin/analytics/sessions');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch session analytics');
    }
    return response.data;
  },

  getMentorAnalytics: async (): Promise<Analytics> => {
    const response = await apiClient.get<Analytics>('/admin/analytics/mentors');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch mentor analytics');
    }
    return response.data;
  },

  getUsers: async (filters?: AdminFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.role) params.append('role', filters.role);

    const response = await apiClient.get<PaginatedResponse<User>>(
      `/admin/users?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch users');
    }
    return response.data;
  },

  getSessions: async (filters?: AdminFilters): Promise<PaginatedResponse<Session>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get<PaginatedResponse<Session>>(
      `/admin/sessions?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch sessions');
    }
    return response.data;
  },

  exportData: async (type: 'sessions' | 'users' | 'feedback', format: 'csv' | 'json'): Promise<Blob> => {
    const response = await apiClient.post(
      '/admin/export',
      { type, format },
      { responseType: 'blob' }
    );
    return response as unknown as Blob;
  },
};



