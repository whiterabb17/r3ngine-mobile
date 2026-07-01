import apiClient from './client';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface RiskSummary {
  score: number;
  priority: Priority;
  path_count: number;
  speculative_count: number;
  top_risk_factors: string[];
}

export interface ScoreBreakdown {
  exploitability: number;
  impact: number;
  confidence: number;
}

export interface AttackPathExtended {
  path_id: string;
  risk: string;
  score: number;
  step_count: number;
  potential_impact: string;
  mitre_tactics?: string[];
  priority: Priority;
  is_speculative: boolean;
  score_breakdown?: ScoreBreakdown;
  leaf_detectability?: 'low' | 'medium' | 'high' | null;
}

export interface ImpactAssessment {
  business_impact: string;
  technical_impact: string;
  affected_assets: { id: number; name: string }[];
  mitre_techniques: { id: string; name: string; tactic: string }[];
}

export const APME_KEYS = {
  riskSummary: (scanId: number | string) => ['apme', 'risk-summary', scanId] as const,
  impact: (pathId: string) => ['apme', 'impact', pathId] as const,
  tree: (targetId: string) => ['apme', 'tree', targetId] as const,
};

export async function getRiskSummary(scanId: number): Promise<RiskSummary> {
  const res = await apiClient.get<RiskSummary>('/mapi/apme/risk-summary/', { params: { scan_id: scanId } });
  return res.data;
}

export async function getImpactAssessment(pathId: string): Promise<ImpactAssessment> {
  const res = await apiClient.get<ImpactAssessment>(`/mapi/apme/impact/${encodeURIComponent(pathId)}/`);
  return res.data;
}

export async function getAttackTree(targetId: string): Promise<{ paths: AttackPathExtended[] }> {
  const res = await apiClient.get<{ paths: AttackPathExtended[] }>(`/mapi/apme/tree/${encodeURIComponent(targetId)}/`);
  return res.data;
}

export async function regenerateImpactAssessment(pathId: string): Promise<{ queued: boolean }> {
  const res = await apiClient.post<{ queued: boolean }>('/mapi/apme/impact/regenerate/', { path_id: pathId });
  return res.data;
}

export async function markPathDismissed(pathId: string, reason?: string): Promise<{ status: string }> {
  const body = reason && reason.length <= 1000 ? { reason } : {};
  const res = await apiClient.patch<{ status: string }>(`/mapi/apme/path/${encodeURIComponent(pathId)}/dismiss/`, body);
  return res.data;
}
