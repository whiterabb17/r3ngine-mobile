import apiClient from './client';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  color: string;
  severity: number;
  criticalVulnCount?: number;
  highVulnCount?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: { data: GraphNode }[];
  edges: { data: GraphEdge }[];
}

export const observabilityApi = {
  getScanGraph: async (scanId: number): Promise<GraphData> => {
    const response = await apiClient.get(`graph/scan/${scanId}/`);
    return response.data;
  },

  getTargetGraph: async (targetId: number): Promise<GraphData> => {
    const response = await apiClient.get(`graph/target/${targetId}/`);
    return response.data;
  },

  getNodeDetails: async (nodeId: string): Promise<any> => {
    const response = await apiClient.get(`graph/node/${nodeId}/`);
    return response.data;
  },

  getSystemLogs: async (): Promise<{ status: boolean; logs: string[] }> => {
    const response = await apiClient.get('system/logs/');
    return response.data;
  },
};
