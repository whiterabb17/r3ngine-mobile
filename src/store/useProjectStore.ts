import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listProjects, Project } from '../api/projects';

interface ProjectState {
  currentProject: string | null;
  availableProjects: Project[];
  setCurrentProject: (slug: string) => void;
  loadProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      availableProjects: [],
      setCurrentProject: (slug) => set({ currentProject: slug }),
      loadProjects: async () => {
        try {
          const projects = await listProjects();
          set((state) => ({
            availableProjects: projects,
            currentProject:
              state.currentProject ?? (projects[0]?.slug ?? null),
          }));
        } catch {
          // network unavailable — keep cached list
        }
      },
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentProject: s.currentProject,
        availableProjects: s.availableProjects,
      }),
    }
  )
);
