import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Instance {
  id: string;
  label: string;
  serverIp: string;
  token: string | null;
  refreshToken: string | null;
}

interface InstanceState {
  instances: Instance[];
  currentInstanceId: string | null;
  addInstance: (data: Omit<Instance, 'id'>) => string;
  removeInstance: (id: string) => void;
  updateTokens: (id: string, token: string, refreshToken: string) => void;
  switchInstance: (id: string) => void;
  getCurrentInstance: () => Instance | null;
}

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useInstanceStore = create<InstanceState>()(
  persist(
    (set, get) => ({
      instances: [],
      currentInstanceId: null,

      addInstance: (data) => {
        const id = generateId();
        set((s) => ({ instances: [...s.instances, { ...data, id }] }));
        return id;
      },

      removeInstance: (id) => {
        const { currentInstanceId } = get();
        if (id === currentInstanceId) return;
        set((s) => ({ instances: s.instances.filter((i) => i.id !== id) }));
      },

      updateTokens: (id, token, refreshToken) => {
        set((s) => ({
          instances: s.instances.map((i) =>
            i.id === id ? { ...i, token, refreshToken } : i
          ),
        }));
      },

      switchInstance: (id) => {
        const inst = get().instances.find((i) => i.id === id);
        if (!inst) return;
        set({ currentInstanceId: id });
      },

      getCurrentInstance: () => {
        const { instances, currentInstanceId } = get();
        return instances.find((i) => i.id === currentInstanceId) ?? null;
      },
    }),
    {
      name: 'instance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
