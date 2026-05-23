import apiClient from './client';

export interface StressConfig {
  concurrency: number;
  duration: string;
  uses_tools: string[];
  selected_endpoints?: string[];
  k6_config?: any;
  wrk_config?: any;
  hping3_config?: any;
  locust_config?: any;
}

export const stressApi = {
  getStressStatus: async (scanId: number) => {
    const response = await apiClient.get<{ scan_id: number; kill_switch_active: boolean }>(`/api/stress/${scanId}/status/`);
    return response.data;
  },

  controlStressTest: async (scanId: number, action: 'start' | 'stop', config?: StressConfig) => {
    const response = await apiClient.post<any>(`/api/stress/${scanId}/control/`, {
      action,
      config,
    });
    return response.data;
  },

  getEndpoints: async (projectSlug: string, scanId: number) => {
    const response = await apiClient.get<any>(`/mapi/listEndpoints/`, {
      params: {
        project: projectSlug,
        scan_history: scanId,
      }
    });
    return response.data.results || response.data || [];
  }
};
