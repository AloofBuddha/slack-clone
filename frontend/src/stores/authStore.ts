import { create } from 'zustand';
import { authApi } from '../services/api';
import { socketService } from '../services/socket';
import { initializeMessageSocketListeners } from './messageStore';
import { initializeChannelSocketListeners } from './channelStore';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password);
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isLoading: false,
      });

      // Connect to socket
      socketService.connect(data.accessToken);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(email, password, displayName);
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isLoading: false,
      });

      // Connect to socket and initialize listeners
      socketService.connect(data.accessToken);
      
      // Wait a bit for socket to connect, then initialize listeners
      setTimeout(() => {
        initializeMessageSocketListeners();
        initializeChannelSocketListeners();
      }, 100);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    socketService.disconnect();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, accessToken: null, refreshToken: null });
      return;
    }

    try {
      const user = await authApi.getMe();
      set({ user, accessToken: token });
      
      // Connect to socket if not already connected
      if (!socketService.isConnected()) {
        socketService.connect(token);
        
        // Wait a bit for socket to connect, then initialize listeners
        setTimeout(() => {
          initializeMessageSocketListeners();
          initializeChannelSocketListeners();
        }, 100);
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null, refreshToken: null });
    }
  },

  clearError: () => set({ error: null }),
}));
