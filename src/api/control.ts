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
  const response = await apiClient.get<ListExternalToolsResponse>('/mapi/external/tool/get_current_release/');
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
