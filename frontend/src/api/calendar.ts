import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface CalendarIntegration {
  id: string;
  provider: 'google' | 'outlook';
  calendarId: string | null;
  isEnabled: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: string;
  name: string;
}

export const calendarApi = {
  getGoogleAuthUrl: async (state?: string): Promise<string> => {
    const response = await apiClient.get<ApiResponse<{ authUrl: string }>>(
      `/calendar/google/auth-url${state ? `?state=${encodeURIComponent(state)}` : ''}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get Google auth URL');
    }
    return response.data.authUrl;
  },

  getOutlookAuthUrl: async (state?: string): Promise<string> => {
    const response = await apiClient.get<ApiResponse<{ authUrl: string }>>(
      `/calendar/outlook/auth-url${state ? `?state=${encodeURIComponent(state)}` : ''}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get Outlook auth URL');
    }
    return response.data.authUrl;
  },

  connectGoogle: async (code: string, calendarId?: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<{}>>('/calendar/google/callback', {
      code,
      calendarId,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to connect Google Calendar');
    }
  },

  connectOutlook: async (code: string, calendarId?: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<{}>>('/calendar/outlook/callback', {
      code,
      calendarId,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to connect Outlook Calendar');
    }
  },

  getIntegrations: async (): Promise<CalendarIntegration[]> => {
    const response = await apiClient.get<ApiResponse<{ integrations: CalendarIntegration[] }>>(
      '/calendar/integrations'
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get calendar integrations');
    }
    return response.data.integrations;
  },

  getCalendars: async (provider: 'google' | 'outlook'): Promise<Calendar[]> => {
    const response = await apiClient.get<ApiResponse<{ calendars: Calendar[] }>>(
      `/calendar/${provider}/calendars`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get calendars');
    }
    return (response.data as any).calendars || [];
  },

  toggleSync: async (provider: 'google' | 'outlook', enabled: boolean): Promise<void> => {
    const response = await apiClient.put<ApiResponse<{}>>(`/calendar/${provider}/sync`, {
      enabled,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to toggle sync');
    }
  },

  disconnect: async (provider: 'google' | 'outlook'): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<{}>>(`/calendar/${provider}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to disconnect calendar');
    }
  },

  syncSession: async (sessionId: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<{}>>(`/calendar/sessions/${sessionId}/sync`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to sync session');
    }
  },
};

