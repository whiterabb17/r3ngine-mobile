import apiClient from './client';

export type ExposureStatus = 'open' | 'accepted' | 'false_positive' | 'resolved';
export type ExposureSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Exposure {
  id: number;
  title: string;
  status: ExposureStatus;
  severity: ExposureSeverity;
  asset_summary: { hostname?: string; ip?: string; port?: number; service?: string };
  evidence_data: Record<string, unknown>;
  evidence_timestamps?: { first_seen: string; last_seen: string };
  linked_vulnerability_ids: number[];
  scan_id?: number;
  created_at: string;
}

export interface ExposureStats {
  total: number;
  open: number;
  accepted: number;
  false_positive: number;
  resolved: number;
  by_severity: Record<ExposureSeverity, number>;
}

export const EXPOSURES_KEYS = {
  list: (scanId?: number, status?: ExposureStatus) => ['exposures', 'list', scanId ?? 'all', status ?? 'all'] as const,
  detail: (id: number) => ['exposures', 'detail', id] as const,
  stats: (scanId?: number) => ['exposures', 'stats', scanId ?? 'all'] as const,
};

const VALID_STATUS: ExposureStatus[] = ['open', 'accepted', 'false_positive', 'resolved'];

function validateStatus(s: ExposureStatus) {
  if (!VALID_STATUS.includes(s)) throw new Error(`Invalid status: ${s}`);
}

function validateNote(n?: string) {
  if (n !== undefined && n.length > 1000) throw new Error('note exceeds 1000 chars');
}

export async function listExposures(scanId?: number, status?: ExposureStatus): Promise<Exposure[]> {
  const params: Record<string, unknown> = {};
  if (scanId !== undefined) params.scan_id = scanId;
  if (status) params.status = status;
  const res = await apiClient.get<Exposure[] | { results: Exposure[] }>('/mapi/exposures/', { params });
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
}

export async function getExposureDetail(id: number): Promise<Exposure> {
  const res = await apiClient.get<Exposure>(`/mapi/exposures/${id}/`);
  return res.data;
}

export async function getExposureStats(scanId?: number): Promise<ExposureStats> {
  const res = await apiClient.get<ExposureStats>('/mapi/exposures/stats/', {
    params: scanId !== undefined ? { scan_id: scanId } : undefined,
  });
  return res.data;
}

export async function updateExposureStatus(id: number, status: ExposureStatus, note?: string): Promise<Exposure> {
  validateStatus(status);
  validateNote(note);
  const body: Record<string, unknown> = { status };
  if (note) body.note = note;
  const res = await apiClient.patch<Exposure>(`/mapi/exposures/${id}/status/`, body);
  return res.data;
}

export async function bulkUpdateExposureStatus(ids: number[], status: ExposureStatus): Promise<{ updated: number[]; rejected: number[] }> {
  validateStatus(status);
  const res = await apiClient.post<{ updated: number[]; rejected: number[] }>('/mapi/exposures/bulk-status/', { ids, status });
  return res.data;
}
