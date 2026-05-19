import apiClient from './client';
import { paths } from '../types/api';

export type TriggerGptVulnerabilityReportResponse = any;
export type TriggerAiInsightsResponse = any;
export type GetAttackPathsResponse = any;
type ReportStatusResponse = any;
type CreateReportResponse = any;

export const triggerGptVulnerabilityReport = async (vulnerabilityId: number): Promise<TriggerGptVulnerabilityReportResponse> => {
  const params = { id: vulnerabilityId };
  const response = await apiClient.get<TriggerGptVulnerabilityReportResponse>('/mapi/tools/gpt_vulnerability_report/', { params });
  return response.data;
};

export const createScanReport = async (scanId: number, options: { 
  reportType?: string; 
  reportTemplate?: string;
  ignoreInfoVuln?: boolean;
  includeAttackSurfaceMap?: boolean;
} = {}) => {
  const params = {
    report_type: options.reportType || 'full',
    report_template: options.reportTemplate || 'default',
    ignore_info_vuln: options.ignoreInfoVuln ? 'True' : 'False',
    include_attack_surface_map: options.includeAttackSurfaceMap ? 'True' : 'False',
  };
  // Note: This endpoint is not currently in the OpenAPI spec under mapi
  const response = await apiClient.get(`/scan/create_report/${scanId}`, { params });
  return response.data;
};

export const getReportStatus = async (reportId: number) => {
  // Note: This endpoint is not currently in the OpenAPI spec under mapi
  const response = await apiClient.get(`/scan/report/status/${reportId}`);
  return response.data;
};

export const triggerAiInsights = async (scanId: number): Promise<TriggerAiInsightsResponse> => {
  const response = await apiClient.post<TriggerAiInsightsResponse>('/mapi/apme/trigger/', { scan_id: scanId });
  return response.data;
};

export const getAttackPaths = async (scanId: number): Promise<GetAttackPathsResponse> => {
  const params = { scan_id: scanId };
  const response = await apiClient.get<GetAttackPathsResponse>('/mapi/apme/paths/', { params });
  return response.data;
};
