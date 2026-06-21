import apiClient from './client';

export interface BountyScope {
  asset_type: string;
  asset_identifier: string;
  eligible_for_bounty: boolean;
  max_severity: string;
}

export interface BountyProgram {
  handle: string;
  name: string;
  offers_bounties: boolean;
  state: string;
  started_accepting_at: string;
  number_of_reports_for_user: number;
  bookmarked: boolean;
  submission_state: string;
  in_scope: BountyScope[];
}

export async function listBountyPrograms(params?: {
  sort_by?: 'name' | 'reports' | 'age';
  sort_order?: 'asc' | 'desc';
}): Promise<BountyProgram[]> {
  const resp = await apiClient.get<BountyProgram[]>('/mapi/hackerone-programs/bounty_programs/', { params });
  return Array.isArray(resp.data) ? resp.data : [];
}

export async function getProgram(handle: string): Promise<BountyProgram> {
  const resp = await apiClient.get<BountyProgram>(`/mapi/hackerone-programs/${handle}/`);
  return resp.data;
}
