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
  members?: string[];
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

export interface GetScanGraphResponse {
  nodes: { data: GraphNode }[];
  edges: { data: GraphEdge }[];
}

export interface GetTargetGraphResponse {
  nodes: { data: GraphNode }[];
  edges: { data: GraphEdge }[];
}

export interface GetNodeDetailsResponse {
  node: GraphNode;
  metadata?: any;
}

export interface SystemLogLine {
  timestamp: string;
  level: string;
  message: string;
  logger?: string;
}

export interface GetSystemLogsResponse {
  status: boolean;
  logs: string[];
}

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
