import api from './api';

export interface AppNotification {
  id: number;
  transferId: number | null;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}

export const notificationService = {
  getAll: async (): Promise<AppNotification[]> => {
    const response = await api.get<AppNotification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: number): Promise<AppNotification> => {
    const response = await api.patch<AppNotification>(`/notifications/${id}/read`);
    return response.data;
  },
};
