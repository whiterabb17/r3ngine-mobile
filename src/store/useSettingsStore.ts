import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface SettingsState {
  serverIp: string | null;
  setServerIp: (ip: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  serverIp: null,
  setServerIp: async (ip: string) => {
    if (typeof ip !== 'string') {
      console.error('setServerIp received non-string value');
      return;
    }
    await SecureStore.setItemAsync('server_ip', ip);
    set({ serverIp: ip });
  },
  loadSettings: async () => {
    const ip = await SecureStore.getItemAsync('server_ip');
    set({ serverIp: ip });
  },
}));
