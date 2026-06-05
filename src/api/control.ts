import apiClient from './client';
import { paths } from '../types/api';

export interface Engine {
  id: number;
  engine_name: string;
  tasks?: string[];
  yaml_configuration?: string;
  default_engine?: boolean | null;
}

export interface ListEnginesResponse {
  engines: Engine[];
}

export interface GetEngineDetailsResponse {
  status: boolean;
  engine: Engine;
}

export interface ListExternalToolsResponse {
  tools: any[];
}

export interface ListWordlistsResponse {
  wordlists: string[];
}

export interface GetWordlistContentResponse {
  content: string;
}


// Engine Management
export const listEngines = async (): Promise<ListEnginesResponse> => {
  const response = await apiClient.get<ListEnginesResponse>('/mapi/listEngines/');
  return response.data;
};

export const getEngineDetails = async (id: number): Promise<GetEngineDetailsResponse> => {
  const params = { id };
  const response = await apiClient.post<GetEngineDetailsResponse>('/mapi/action/engine/get/', params);
  return response.data;
};

// Tool Management
export const listExternalTools = async (): Promise<ListExternalToolsResponse> => {
  const response = await apiClient.get<ListExternalToolsResponse>('/mapi/listTools/');
  return response.data;
};

// Wordlist Management
export const listWordlists = async (): Promise<ListWordlistsResponse> => {
  const response = await apiClient.get<ListWordlistsResponse>('/mapi/listWordlists/');
  return response.data;
};

export const getWordlistContent = async (filename: string): Promise<GetWordlistContentResponse> => {
  const params = { filename };
  // Note: schema says GET for wordlist read list, but implementation was POST.
  // Let's use the path and method from types if possible, but keep existing logic if types say otherwise.
  // Actually, api.ts says get: operations["mapi_action_wordlist_read_list"]
  const response = await apiClient.get<GetWordlistContentResponse>('/mapi/action/wordlist/read/', { params });
  return response.data;
};

// Plugin Management
export interface Plugin {
  name: string;
  slug: string;
  description: string;
  is_enabled: boolean;
  anchor_step: string;
  version: string;
  trust_level: string;
}

export const listPlugins = async (): Promise<Plugin[]> => {
  const response = await apiClient.get<Plugin[] | { results: Plugin[] }>('/mapi/plugins/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results ?? []);
};

// Hardware Profiles
export interface HardwareProfile {
  id: number;
  name: string;
  description?: string;
  threads: number;
  rate_limit: number;
  timeout: number;
  delay: number;
  retries: number;
  profile_type: 'builtin' | 'custom';
  is_default: boolean;
  is_active: boolean;
}

export const listHardwareProfiles = async (): Promise<HardwareProfile[]> => {
  const response = await apiClient.get<HardwareProfile[] | { results: HardwareProfile[] }>('/mapi/hardwareProfiles/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results ?? []);
};

