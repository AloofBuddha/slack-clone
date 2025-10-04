import { create } from 'zustand';
import { workspacesApi } from '../services/api';
import type { Workspace } from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  inviteUser: (workspaceId: string, email: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspacesApi.getAll();
      set({ workspaces, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch workspaces',
        isLoading: false,
      });
    }
  },

  fetchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspacesApi.getById(id);
      set({ currentWorkspace: workspace, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch workspace',
        isLoading: false,
      });
    }
  },

  createWorkspace: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspacesApi.create(name, description);
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        currentWorkspace: workspace,
        isLoading: false,
      }));
      return workspace;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  inviteUser: async (workspaceId: string, email: string) => {
    try {
      await workspacesApi.invite(workspaceId, email);
      // Refresh workspace to get updated members
      await get().fetchWorkspace(workspaceId);
    } catch (error: any) {
      throw error;
    }
  },

  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace });
  },
}));
