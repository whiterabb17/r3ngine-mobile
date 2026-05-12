import apiClient from './client';

export interface InAppNotification {
  id: number;
  title: string;
  description: string;
  icon: string;
  is_read: boolean;
  created_at: string;
  notification_type: string;
  status: 'info' | 'success' | 'warning' | 'error';
  redirect_link: string | null;
  open_in_new_tab: boolean;
  project: number | null;
}

export const getNotifications = async (projectSlug?: string) => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  const response = await apiClient.get<InAppNotification[]>('api/notifications/', { params });
  return response.data;
};

export const getUnreadCount = async (projectSlug?: string) => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  const response = await apiClient.get<{ count: number }>('api/notifications/unread_count/', { params });
  return response.data.count;
};

export const markAsRead = async (id: number) => {
  await apiClient.post(`api/notifications/${id}/mark_read/`);
};

export const markAllRead = async (projectSlug?: string) => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  await apiClient.post('api/notifications/mark_all_read/', {}, { params });
};

export const clearAllNotifications = async (projectSlug?: string) => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  await apiClient.post('api/notifications/clear_all/', {}, { params });
};
