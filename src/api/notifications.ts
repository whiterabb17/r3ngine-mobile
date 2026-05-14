import apiClient from './client';
import { paths, components } from '../types/api';

export type InAppNotification = components['schemas']['InAppNotification'];

type GetNotificationsResponse = paths['/mapi/notifications/']['get']['responses']['200']['content']['application/json'];
type UnreadCountResponse = paths['/mapi/notifications/unread_count/']['get']['responses']['200']['content']['application/json'];

export const getNotifications = async (projectSlug?: string): Promise<GetNotificationsResponse> => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  const response = await apiClient.get<GetNotificationsResponse>('/mapi/notifications/', { params });
  return response.data;
};

export const getUnreadCount = async (projectSlug?: string): Promise<number> => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  const response = await apiClient.get<UnreadCountResponse>('/mapi/notifications/unread_count/', { params });
  return response.data.count || 0;
};

export const markAsRead = async (id: number): Promise<void> => {
  await apiClient.post(`/mapi/notifications/${id}/mark_read/`);
};

export const markAllRead = async (projectSlug?: string): Promise<void> => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  await apiClient.post('/mapi/notifications/mark_all_read/', {}, { params });
};

export const clearAllNotifications = async (projectSlug?: string): Promise<void> => {
  const params = projectSlug ? { project_slug: projectSlug } : {};
  await apiClient.post('/mapi/notifications/clear_all/', {}, { params });
};
