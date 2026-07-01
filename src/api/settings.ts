import apiClient from './client';

export interface ScanWorker {
  id: number;
  name: string;
  description: string | null;
  task_queue: string;
  hostname: string | null;
  ip_address: string | null;
  is_active: boolean;
  last_heartbeat: string | null;
}

export interface InstalledTool {
  id: number;
  name: string;
  description: string;
  github_url: string;
  update_command: string | null;
  install_command: string;
  version_lookup_command: string | null;
  is_default: boolean;
  is_github_cloned: boolean;
  logo_url: string | null;
}

export interface ReNgineSettings {
  total: number;
  used: number;
  free: number;
  consumed_percent: number;
  enable_scan_queueing: boolean;
}

export interface ReportSettings {
  id?: number;
  primary_color: string | null;
  secondary_color: string | null;
  company_name: string | null;
  company_address: string | null;
  company_email: string | null;
  company_website: string | null;
  show_rengine_banner: boolean;
  show_executive_summary: boolean;
  enable_llm_report_generation: boolean;
  show_footer: boolean;
  footer_text: string | null;
  include_attack_surface_map: boolean;
}

export interface NotificationSettings {
  id?: number;
  send_to_slack: boolean;
  send_to_lark: boolean;
  send_to_discord: boolean;
  send_to_telegram: boolean;
  slack_hook_url: string | null;
  lark_hook_url: string | null;
  discord_hook_url: string | null;
  telegram_bot_token: string | null;
  telegram_bot_chat_id: string | null;
  send_scan_status_notif: boolean;
  send_interesting_notif: boolean;
  send_vuln_notif: boolean;
  send_subdomain_changes_notif: boolean;
  send_scan_output_file: boolean;
  send_scan_tracebacks: boolean;
}

export async function getWorkers(): Promise<ScanWorker[]> {
  const resp = await apiClient.get<ScanWorker[]>('/mapi/workers/');
  return Array.isArray(resp.data) ? resp.data : [];
}

export async function patchWorker(
  id: number,
  data: Partial<Pick<ScanWorker, 'is_active'>>
): Promise<ScanWorker> {
  const resp = await apiClient.patch<ScanWorker>(`/mapi/workers/${id}/`, data);
  return resp.data;
}

export async function listTools(): Promise<InstalledTool[]> {
  const resp = await apiClient.get<InstalledTool[]>('/mapi/listTools/');
  return Array.isArray(resp.data) ? resp.data : [];
}

export async function updateTool(name: string): Promise<{ status: boolean; message: string }> {
  const resp = await apiClient.post<{ status: boolean; message: string }>(
    '/mapi/tool/update/', { name }
  );
  return resp.data;
}

export async function uninstallTool(name: string): Promise<{ status: boolean; message: string }> {
  const resp = await apiClient.post<{ status: boolean; message: string }>(
    '/mapi/tool/uninstall/', { name }
  );
  return resp.data;
}

export async function getReNgineSettings(): Promise<ReNgineSettings> {
  const resp = await apiClient.get<ReNgineSettings>('/mapi/rengine/system-settings/');
  return resp.data;
}

export async function patchReNgineSettings(
  data: Partial<ReNgineSettings>
): Promise<ReNgineSettings> {
  const resp = await apiClient.post<ReNgineSettings>('/mapi/rengine/system-settings/', data);
  return resp.data;
}

export async function getReportSettings(): Promise<ReportSettings> {
  const resp = await apiClient.get<ReportSettings>('/mapi/report-settings/');
  return resp.data;
}

export async function patchReportSettings(
  data: Partial<ReportSettings>
): Promise<ReportSettings> {
  const resp = await apiClient.post<ReportSettings>('/mapi/report-settings/', data);
  return resp.data;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const resp = await apiClient.get<NotificationSettings>('/mapi/notification-settings/');
  return resp.data;
}

export async function patchNotificationSettings(
  data: Partial<NotificationSettings>
): Promise<{ status: boolean; message: string }> {
  const resp = await apiClient.post<{ status: boolean; message: string }>(
    '/mapi/notification-settings/', data
  );
  return resp.data;
}
