import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  byChannel: {
    email: number;
    sms: number;
    push: number;
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const notificationApi = {
  getNotifications: async (page: number = 1, limit: number = 20): Promise<NotificationResponse> => {
    const response = await apiClient.get<NotificationResponse>(
      `/notifications?page=${page}&limit=${limit}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch notifications');
    }
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await apiClient.put<{ notification: Notification }>(
      `/notifications/${notificationId}/read`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark notification as read');
    }
    return response.data.notification;
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    const response = await apiClient.put<{ count: number }>('/notifications/read-all');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark all notifications as read');
    }
    return response.data;
  },

  getDeliveryStatus: async (notificationId: string): Promise<NotificationDelivery[]> => {
    const response = await apiClient.get<{ deliveries: NotificationDelivery[] }>(
      `/notifications/${notificationId}/delivery`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch delivery status');
    }
    return response.data.deliveries;
  },

  getDeliveryStats: async (): Promise<NotificationStats> => {
    const response = await apiClient.get<{ stats: NotificationStats }>('/notifications/delivery/stats');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch delivery stats');
    }
    return response.data.stats;
  },
};

