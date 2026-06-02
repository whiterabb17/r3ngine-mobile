import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface SettingsState {
  serverIp: string | null;
  pushEnabled: boolean | null;
  setServerIp: (ip: string) => Promise<void>;
  setPushEnabled: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  serverIp: null,
  pushEnabled: null,
  setServerIp: async (ip: string) => {
    if (typeof ip !== 'string') {
      console.error('setServerIp received non-string value');
      return;
    }
    await SecureStore.setItemAsync('server_ip', ip);
    set({ serverIp: ip });
  },
  setPushEnabled: async (enabled: boolean) => {
    await SecureStore.setItemAsync('push_enabled', enabled ? '1' : '0');
    set({ pushEnabled: enabled });
  },
  loadSettings: async () => {
    const ip = await SecureStore.getItemAsync('server_ip');
    const pushRaw = await SecureStore.getItemAsync('push_enabled');
    // null means never explicitly set (first run) — treat as enabled
    const pushEnabled = pushRaw === null ? null : pushRaw === '1';
    set({ serverIp: ip, pushEnabled });
  },
}));
