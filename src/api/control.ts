import apiClient from './client';
import { paths } from '../types/api';

type ListEnginesResponse = paths['/mapi/listEngines/']['get']['responses']['200']['content']['application/json'];
type GetEngineDetailsResponse = paths['/mapi/action/engine/get/']['post']['responses']['201']['content']['application/json'];
type ListExternalToolsResponse = paths['/mapi/external/tool/get_current_release/']['get']['responses']['200']['content']['application/json'];
type ListWordlistsResponse = paths['/mapi/listWordlists/']['get']['responses']['200']['content']['application/json'];
type GetWordlistContentResponse = paths['/mapi/action/wordlist/read/']['get']['responses']['200']['content']['application/json'];

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
