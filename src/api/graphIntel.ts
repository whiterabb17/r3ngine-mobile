import apiClient from './client';

export interface ChainGraphNode {
  id: string;
  type: string;
  color: string;
  properties: Record<string, unknown>;
}

export interface ChainGraphEdge {
  from: string | null;
  to: string;
  type: string;
  confidence?: number;
}

export interface ChainGraphResponse {
  nodes: ChainGraphNode[];
  edges: ChainGraphEdge[];
}

export interface ChainNodesByTypeResponse {
  type: string;
  count: number;
  nodes: Array<Record<string, unknown>>;
}

export const GRAPH_KEYS = {
  chain: (scanId: number) => ['graph', 'chain', scanId] as const,
  chainNodes: (scanId: number, type: string) => ['graph', 'chain', 'nodes', scanId, type] as const,
};

export async function getFullChainGraph(scanId: number): Promise<ChainGraphResponse> {
  const res = await apiClient.get<ChainGraphResponse>('/mapi/graph/chain/', {
    params: { scan_id: scanId },
  });
  return res.data;
}

export async function getChainNodesByType(
  scanId: number,
  nodeType: string,
): Promise<ChainNodesByTypeResponse> {
  const res = await apiClient.get<ChainNodesByTypeResponse>('/mapi/graph/chain/nodes/', {
    params: { scan_id: scanId, type: nodeType },
  });
  return res.data;
}
