import apiClient from './client';

export type APIType = 'rest' | 'graphql' | 'soap' | 'generic';

export interface APIIntelProfile {
  id: number;
  scan_history: number | null;
  target_domain: number | null;
  subdomain: number | null;
  base_url: string;
  api_type: APIType;
  endpoint_count: number;
  requires_auth: boolean;
  auth_scheme: string | null;
  parameters_sample: Array<Record<string, unknown>>;
  graphql_schema_snippet: string | null;
  raw_endpoints: Array<{ url: string; status: number }>;
}

export const API_INTEL_KEYS = {
  list: (scanId?: number) => ['api-intel', 'list', scanId] as const,
  detail: (id: number) => ['api-intel', 'detail', id] as const,
};

function normaliseList(data: unknown): APIIntelProfile[] {
  if (Array.isArray(data)) return data as APIIntelProfile[];
  const typed = data as { results?: APIIntelProfile[] };
  if (typed?.results && Array.isArray(typed.results)) return typed.results;
  return [];
}

export async function listAPIIntelProfiles(scanId?: number): Promise<APIIntelProfile[]> {
  const params = scanId !== undefined ? { scan_id: scanId } : undefined;
  const res = await apiClient.get<unknown>('/mapi/api-intel/', { params });
  return normaliseList(res.data);
}

export async function getAPIIntelProfile(id: number): Promise<APIIntelProfile> {
  const res = await apiClient.get<APIIntelProfile>(`/mapi/api-intel/${id}/`);
  return res.data;
}
