import apiClient from './client';
import { paths } from '../types/api';

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

type GetScanGraphResponse = paths['/mapi/graph/scan/{scan_id}/']['get']['responses']['200']['content']['application/json'];
type GetTargetGraphResponse = paths['/mapi/graph/target/{target_id}/']['get']['responses']['200']['content']['application/json'];
type GetNodeDetailsResponse = paths['/mapi/graph/node/{node_id}/']['get']['responses']['200']['content']['application/json'];
type GetSystemLogsResponse = paths['/mapi/system/logs/']['get']['responses']['200']['content']['application/json'];

export const fetchScanMetrics = async (scanId: number) => {
  return apiClient.get<any>(`/mapi/observability/metrics/`, {
    params: { scan_id: scanId }
  });
};

export const observabilityApi = {
  getScanGraph: async (scanId: number): Promise<GetScanGraphResponse> => {
    const response = await apiClient.get<GetScanGraphResponse>(`/mapi/graph/scan/${scanId}/`);
    return response.data;
  },

  getTargetGraph: async (targetId: number): Promise<GetTargetGraphResponse> => {
    const response = await apiClient.get<GetTargetGraphResponse>(`/mapi/graph/target/${targetId}/`);
    return response.data;
  },

  getNodeDetails: async (nodeId: string): Promise<GetNodeDetailsResponse> => {
    const response = await apiClient.get<GetNodeDetailsResponse>(`/mapi/graph/node/${nodeId}/`);
    return response.data;
  },

  getSystemLogs: async (): Promise<GetSystemLogsResponse> => {
    const response = await apiClient.get<GetSystemLogsResponse>('/mapi/system/logs/');
    return response.data;
  },
};
