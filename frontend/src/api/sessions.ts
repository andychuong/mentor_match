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
  mentorNotes?: string;
  menteeNotes?: string;
}

export const sessionsApi = {
  list: async (filters?: SessionFilters): Promise<PaginatedResponse<Session>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.mentorId) params.append('mentorId', filters.mentorId);
    if (filters?.menteeId) params.append('menteeId', filters.menteeId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    try {
      const response = await apiClient.get<PaginatedResponse<Session>>(
        `/sessions?${params.toString()}`
      );
      
      // Handle different response formats
      if (response.success && response.data) {
        // If response.data is already a PaginatedResponse (has items and pagination)
        if ('items' in response.data && 'pagination' in response.data) {
          return response.data;
        }
        // If response.data is wrapped in another data property
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          return (response.data as any).data;
        }
      }
      
      // Fallback: return empty paginated response
      console.warn('Unexpected sessions API response format:', response);
      return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    } catch (error: any) {
      console.error('Sessions API error:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Session> => {
    const response = await apiClient.get<{ session: Session }>(`/sessions/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch session');
    }
    // Backend returns { data: { session: {...} } }
    return response.data.session;
  },

  create: async (data: CreateSessionData): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    return response.data;
  },

  update: async (id: string, data: UpdateSessionData): Promise<Session> => {
    const response = await apiClient.put<{ session: Session }>(`/sessions/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update session');
    }
    // Backend returns { data: { session: {...} } }
    return response.data.session;
  },

  cancel: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/sessions/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel session');
    }
  },
};

