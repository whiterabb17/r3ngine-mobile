import apiClient from './client';

export interface ScanProfile {
  id: number;
  name: string;
  category: string;
  is_builtin: boolean;
  description?: string;
}

export async function listProfiles(): Promise<ScanProfile[]> {
  const resp = await apiClient.get<{ results?: ScanProfile[] } | ScanProfile[]>('/mapi/scanProfiles/');
  if (Array.isArray(resp.data)) return resp.data;
  return (resp.data as any).results ?? [];
}

export async function getProfile(name: string): Promise<ScanProfile> {
  const resp = await apiClient.get<ScanProfile>(`/mapi/scanProfiles/${name}/`);
  return resp.data;
}
