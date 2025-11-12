import { apiClient } from './client';
import { ApiResponse, User } from '@/types';

export const usersApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/users/me');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user');
    }
    // Handle both { user: {...} } and direct user object
    return (response.data as any).user || response.data;
  },

  updateCurrentUser: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<{ user: User }>('/users/me', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user');
    }
    // Handle both { user: {...} } and direct user object
    return (response.data as any).user || response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<{ user: User }>(`/users/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user');
    }
    // Handle both { user: {...} } and direct user object
    return (response.data as any).user || response.data;
  },
};

