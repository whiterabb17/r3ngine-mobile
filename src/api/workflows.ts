import apiClient from './client';

export interface WorkflowDef {
  slug: string;
  name: string;
  description: string;
  required_fields: string[];
}

export interface WorkflowStartResult {
  workflow_id: string;
  status: string;
}

export async function listWorkflows(): Promise<WorkflowDef[]> {
  const resp = await apiClient.get<{ workflows: WorkflowDef[] }>('/mapi/workflows/');
  return resp.data.workflows ?? [];
}

export async function startWorkflow(
  slug: string,
  body: Record<string, unknown>
): Promise<WorkflowStartResult> {
  const resp = await apiClient.post<WorkflowStartResult>(
    `/mapi/workflows/${slug}/start/`,
    body
  );
  return resp.data;
}
