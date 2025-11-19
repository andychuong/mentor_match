import { apiClient } from './client';
import { ApiResponse, AuthResponse, LoginCredentials, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Login failed');
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (): Promise<{ accessToken: string; expiresIn: number }> => {
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Token refresh failed');
    }
    return response.data;
  },

  resetPassword: async (email: string): Promise<void> => {
    const response = await apiClient.post('/auth/reset-password', { email });
    if (!response.success) {
      throw new Error(response.error?.message || 'Password reset request failed');
    }
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    const response = await apiClient.post('/auth/reset-password/confirm', { token, newPassword });
    if (!response.success) {
      throw new Error(response.error?.message || 'Password reset failed');
    }
  },
};





