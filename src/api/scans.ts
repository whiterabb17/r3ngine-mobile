import apiClient from './client';

export interface ScheduledScan {
  id: number;
  name: string;
  task: string;
  description: string;
  frequency: string;
  enabled: boolean;
  last_run_at: string | null;
  total_run_count: number;
  one_off: boolean;
  kwargs: Record<string, unknown>;
  date_changed: string;
}

export interface SubScan {
  id: number;
  type: string;
  subdomain_name: string;
  start_scan_date: string | null;
  stop_scan_date: string | null;
  scan_history: number;
  subdomain: number;
  workflow_ids: string[];
  status: number;
  task: string;
  engine: string;
  time_taken: string | null;
  elapsed_time: string | null;
  completed_ago: string | null;
}

export interface EngineConfig {
  id: number;
  engine_name: string;
  yaml_configuration: string;
  default_engine: boolean;
  tasks: string[];
}

export async function listScheduledScans(project: string): Promise<ScheduledScan[]> {
  const resp = await apiClient.get<ScheduledScan[] | { results: ScheduledScan[] }>(
    '/mapi/scheduledScans/',
    { params: { project } }
  );
  return Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
}

export async function toggleScheduledScan(id: number): Promise<{ enabled: boolean }> {
  const resp = await apiClient.post<{ status: boolean; enabled: boolean }>(
    `/mapi/scheduledScans/${id}/toggle/`
  );
  return { enabled: resp.data.enabled };
}

export async function deleteScheduledScan(id: number): Promise<void> {
  await apiClient.delete(`/mapi/scheduledScans/${id}/`);
}

export async function listSubScans(project: string, scanHistoryId?: number): Promise<SubScan[]> {
  const params: Record<string, string | number> = { project };
  if (scanHistoryId !== undefined) params.scan_history = scanHistoryId;
  const resp = await apiClient.get<SubScan[] | { results: SubScan[] }>(
    '/mapi/subscans/',
    { params }
  );
  return Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
}

export async function getScanEngineConfig(): Promise<{ engines: EngineConfig[]; configurations: any[] }> {
  const resp = await apiClient.get<{ engines: EngineConfig[]; configurations: any[] }>(
    '/mapi/scan-config/'
  );
  return resp.data;
}

export interface SubdomainPort {
  number: number;
  service_name: string;
  is_uncommon: boolean;
}

export interface SubdomainIpAddress {
  address: string;
  is_cdn: boolean;
  ports: SubdomainPort[];
}

export interface ScanSubdomain {
  id: number;
  name: string;
  http_status: number;
  page_title: string;
  http_url: string;
  origin_ip: string;
  response_time: number;
  screenshot_path: string;
  screenshots?: Array<{ screenshot_path: string }>;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  content_length: number;
  is_important: boolean;
  ip_addresses: SubdomainIpAddress[];
}

export async function fetchSubdomains(scanId: number): Promise<ScanSubdomain[]> {
  const resp = await apiClient.get<{ subdomains: ScanSubdomain[] }>(
    '/mapi/querySubdomains/',
    { params: { scan_id: scanId } }
  );
  return resp.data.subdomains ?? [];
}
