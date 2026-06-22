import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  setTokens: async (access: string, refresh: string) => {
    if (typeof access !== 'string' || typeof refresh !== 'string') {
      console.error('setTokens received non-string values');
      return;
    }
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    set({ token: access, refreshToken: refresh, isAuthenticated: true });
    // Sync refreshed tokens back into the instance store so stored credentials stay current
    const { useInstanceStore } = require('./useInstanceStore');
    const instStore = useInstanceStore.getState();
    if (instStore.currentInstanceId) {
      instStore.updateTokens(instStore.currentInstanceId, access, refresh);
    }
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ token: null, refreshToken: null, isAuthenticated: false });
  },
  loadAuth: async () => {
    const access = await SecureStore.getItemAsync('access_token');
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (access && refresh) {
      set({ token: access, refreshToken: refresh, isAuthenticated: true });
    }
  },
}));
