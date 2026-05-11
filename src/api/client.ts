import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

const apiClient = axios.create();

apiClient.interceptors.request.use(async (config) => {
  const { serverIp } = useSettingsStore.getState();
  const { token } = useAuthStore.getState();

  if (serverIp) {
    let baseUrl = serverIp.includes('://') ? serverIp : `http://${serverIp}`;
    if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
    }
    config.baseURL = `${baseUrl}mapi/`;
  }
  // Ensure we are talking to the API namespace
  if (!config.url?.startsWith('api/')) {
      // Only prepend if it's not already there
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    headers: config.headers,
    data: config.data
  });

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.log(`[API Error Response] ${error.response.status} ${error.config.url}`, error.response.data);
    } else if (error.request) {
      console.log(`[API Error Request] No response received for ${error.config.url}`, error.request);
    } else {
      console.log(`[API Error Message] ${error.message}`);
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      const { serverIp } = useSettingsStore.getState();

      if (refreshToken && serverIp) {
        try {
          const baseUrl = serverIp.includes('://') ? serverIp : `http://${serverIp}`;
          const res = await axios.post(`${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}mapi/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          await setTokens(res.data.access, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return apiClient(originalRequest);
        } catch (e) {
          await logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getMediaSource = (path: string) => {
  const { serverIp } = useSettingsStore.getState();
  const { token } = useAuthStore.getState();
  if (!serverIp || !path) return undefined;

  let baseUrl = serverIp.includes('://') ? serverIp : `http://${serverIp}`;
  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }
  const uri = `${baseUrl}mapi/media/?path=${encodeURIComponent(path)}`;
  console.log(`[getMediaSource] Constructed URI: ${uri}`);
  return {
    uri,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

export default apiClient;
