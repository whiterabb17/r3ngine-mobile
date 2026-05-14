import apiClient from './client';

// Engine Management
export const listEngines = async () => {
  const response = await apiClient.get('api/listEngines/');
  return response.data;
};

export const getEngineDetails = async (id: number) => {
  const params = { id };
  const response = await apiClient.post('api/action/engine/get/', params);
  return response.data;
};

// Tool Management
export const listExternalTools = async () => {
  const response = await apiClient.get('api/external/tool/get_current_release/');
  return response.data;
};

// Wordlist Management
export const listWordlists = async () => {
  const response = await apiClient.get('api/listWordlists/');
  return response.data;
};

export const getWordlistContent = async (filename: string) => {
  const params = { filename };
  const response = await apiClient.post('api/action/wordlist/read/', params);
  return response.data;
};
