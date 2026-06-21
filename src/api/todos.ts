import apiClient from './client';

export interface Todo {
  id: number;
  title: string;
  description: string;
  is_done: boolean;
  is_important: boolean;
  project: number;
  domain_name: string | null;
  subdomain_name: string | null;
  scan_started_time: string | null;
}

interface ListTodosParams {
  project?: string;
  scan_id?: number;
}

export async function listTodos(params?: ListTodosParams): Promise<Todo[]> {
  const resp = await apiClient.get<{ todos: Todo[] }>('/mapi/todos/', { params });
  return resp.data.todos ?? [];
}

export async function createTodo(data: {
  title: string;
  description?: string;
  project: string;
  scan_id?: number;
}): Promise<Todo> {
  const resp = await apiClient.post<Todo>('/mapi/todos/', data);
  return resp.data;
}

export async function patchTodo(
  id: number,
  data: Partial<Pick<Todo, 'title' | 'description' | 'is_done' | 'is_important'>>
): Promise<Todo> {
  const resp = await apiClient.patch<Todo>(`/mapi/todos/${id}/`, data);
  return resp.data;
}

export async function deleteTodo(id: number): Promise<void> {
  await apiClient.delete(`/mapi/todos/${id}/`);
}
