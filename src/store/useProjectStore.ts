import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProjectState {
  currentProject: string | null;
  setCurrentProject: (slug: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      setCurrentProject: (slug) => set({ currentProject: slug }),
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
