import { apiClient } from './client';
import { Mentor } from '@/types';

export const matchingApi = {
    refresh: async (): Promise<Mentor[]> => {
        const response = await apiClient.post<Mentor[]>('/matching/refresh');
        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to refresh matches');
        }
        return Array.isArray(response.data) ? response.data : [];
    },
};
