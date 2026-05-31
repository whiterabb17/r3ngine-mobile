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
    config.baseURL = baseUrl;
  }

  if (config.url?.startsWith('/') && config.baseURL?.endsWith('/')) {
    config.url = config.url.substring(1);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Security: Mask token in logs and only log essential info
  const logHeaders = { ...config.headers };
  if (logHeaders.Authorization) {
    logHeaders.Authorization = 'Bearer [MASKED]';
  }

  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    headers: logHeaders,
    data: config.data ? 'Data payload present' : 'No data'
  });

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Only log success status to avoid data exposure
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.log(`[API Error Response] ${error.response.status} ${error.config.url}`);
    } else if (error.request) {
      console.log(`[API Error Request] No response received for ${error.config.url}`);
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
    headers: token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>),
  };
};

export default apiClient;
