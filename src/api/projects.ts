import apiClient from './client';

export interface Project {
  id: number;
  name: string;
  slug: string;
  insert_date: string;
}

export async function listProjects(): Promise<Project[]> {
  const resp = await apiClient.get<Project[]>('/mapi/projects/');
  return Array.isArray(resp.data) ? resp.data : (resp.data as any).results ?? [];
}

export async function createProject(name: string): Promise<Project> {
  const resp = await apiClient.post<{ status: boolean; project_name: string; slug: string; id: number }>(
    '/mapi/action/create/project',
    { name }
  );
  return { id: resp.data.id, name: resp.data.project_name, slug: resp.data.slug, insert_date: '' };
}
