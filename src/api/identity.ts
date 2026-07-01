import apiClient from './client';

export type IdentityProvider = 'okta' | 'azure_ad' | 'auth0' | 'ping' | 'onelogin' | 'jumpcloud' | 'other';
export type MatchStrength = 'high' | 'medium' | 'low';

export interface IdentityInfraDiscovery {
  id: number;
  provider: IdentityProvider;
  match_strength: MatchStrength;
  detection_signals: {
    matched_urls: string[];
    matched_titles: string[];
    matched_headers: Record<string, string>;
  };
  target_id?: number;
  scan_id?: number;
  first_seen: string;
  confirmed?: boolean;
  dismissed?: boolean;
}

export const IDENTITY_KEYS = {
  list: (scanId?: number) => ['identity', 'list', scanId ?? 'all'] as const,
  detail: (id: number) => ['identity', 'detail', id] as const,
};

export async function listIdentityInfra(scanId?: number): Promise<IdentityInfraDiscovery[]> {
  const res = await apiClient.get<IdentityInfraDiscovery[] | { results: IdentityInfraDiscovery[] }>('/mapi/identity/', {
    params: scanId !== undefined ? { scan_id: scanId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
}

export async function getIdentityInfraDetail(id: number): Promise<IdentityInfraDiscovery> {
  const res = await apiClient.get<IdentityInfraDiscovery>(`/mapi/identity/${id}/`);
  return res.data;
}

export async function confirmIdentityProvider(id: number, confirmed: boolean): Promise<IdentityInfraDiscovery> {
  const res = await apiClient.patch<IdentityInfraDiscovery>(`/mapi/identity/${id}/confirm/`, { confirmed });
  return res.data;
}

export async function dismissIdentityDiscovery(id: number, reason?: string): Promise<IdentityInfraDiscovery> {
  if (reason !== undefined && reason.length > 1000) throw new Error('reason exceeds 1000 chars');
  const body: Record<string, unknown> = {};
  if (reason) body.reason = reason;
  const res = await apiClient.patch<IdentityInfraDiscovery>(`/mapi/identity/${id}/dismiss/`, body);
  return res.data;
}
