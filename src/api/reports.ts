import apiClient from './client';

export const triggerGptVulnerabilityReport = async (vulnerabilityId: number) => {
  const params = { id: vulnerabilityId };
  const response = await apiClient.get('api/tools/gpt_vulnerability_report/', { params });
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
  const response = await apiClient.get(`scan/create_report/${scanId}`, { params });
  return response.data;
};

export const getReportStatus = async (reportId: number) => {
  const response = await apiClient.get(`scan/report/status/${reportId}`);
  return response.data;
};

export const triggerAiInsights = async (scanId: number) => {
  const response = await apiClient.post('api/apme/trigger/', { scan_id: scanId });
  return response.data;
};

export const getAttackPaths = async (scanId: number) => {
  const params = { scan_id: scanId };
  const response = await apiClient.get('api/apme/paths/', { params });
  return response.data;
};
