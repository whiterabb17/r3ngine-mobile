import apiClient from './client';

export interface Plugin {
  id: number;
  name: string;
  slug: string;
  version: string;
  description: string | null;
  is_enabled: boolean;
  anchor_step: string;
  runtime_position: 'BEFORE' | 'AFTER';
  order_weight: number;
  author: string;
  trust_level: string;
  installed_at: string;
}

export interface InstallStep {
  key: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
}

export interface InstallStatus {
  status: 'running' | 'completed' | 'failed';
  steps: InstallStep[];
  plugin_name: string | null;
}

export async function listPlugins(): Promise<Plugin[]> {
  const resp = await apiClient.get<Plugin[]>('/mapi/plugins/');
  return Array.isArray(resp.data) ? resp.data : (resp.data as any).results ?? [];
}

export async function setPluginEnabled(slug: string, is_enabled: boolean): Promise<Plugin> {
  const resp = await apiClient.patch<Plugin>(`/mapi/plugins/${slug}/`, { is_enabled });
  return resp.data;
}

export async function uploadPlugin(fileUri: string, fileName: string): Promise<{ install_id: string }> {
  const form = new FormData();
  form.append('file', { uri: fileUri, name: fileName, type: 'application/zip' } as any);
  const resp = await apiClient.post<{ install_id: string }>('/mapi/plugins/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data;
}

export async function getInstallStatus(installId: string): Promise<InstallStatus> {
  const resp = await apiClient.get<InstallStatus>(`/mapi/plugins/install-status/?id=${installId}`);
  return resp.data;
}
