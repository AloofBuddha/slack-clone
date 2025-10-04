import axios from 'axios';
import type { AuthResponse, Workspace, Channel, Message, MessageResponse, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (email: string, password: string, displayName: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', { email, password, displayName });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },
};

// Workspaces API
export const workspacesApi = {
  getAll: async (): Promise<Workspace[]> => {
    const { data } = await api.get('/workspaces');
    return data;
  },

  getById: async (id: string): Promise<Workspace> => {
    const { data } = await api.get(`/workspaces/${id}`);
    return data;
  },

  create: async (name: string, description?: string): Promise<Workspace> => {
    const { data } = await api.post('/workspaces', { name, description });
    return data;
  },

  invite: async (workspaceId: string, email: string): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/workspaces/${workspaceId}/invite`, { email });
    return data;
  },
};

// Channels API
export const channelsApi = {
  getAll: async (workspaceId: string): Promise<Channel[]> => {
    const { data } = await api.get('/channels', { params: { workspaceId } });
    return data;
  },

  getById: async (id: string): Promise<Channel> => {
    const { data } = await api.get(`/channels/${id}`);
    return data;
  },

  create: async (workspaceId: string, name: string, description?: string, isPrivate?: boolean): Promise<Channel> => {
    const { data } = await api.post('/channels', { workspaceId, name, description, isPrivate });
    return data;
  },

  join: async (channelId: string): Promise<void> => {
    await api.post(`/channels/${channelId}/join`);
  },

  leave: async (channelId: string): Promise<void> => {
    await api.delete(`/channels/${channelId}/leave`);
  },

  markAsRead: async (channelId: string): Promise<void> => {
    await api.post(`/channels/${channelId}/read`);
  },
};

// Messages API
export const messagesApi = {
  getChannelMessages: async (channelId: string, page = 1, limit = 50): Promise<MessageResponse> => {
    const { data } = await api.get(`/messages/channel/${channelId}`, {
      params: { page, limit },
    });
    return data;
  },

  getThreadMessages: async (parentId: string): Promise<Message[]> => {
    const { data } = await api.get(`/messages/thread/${parentId}`);
    return data;
  },

  send: async (channelId: string, content: string, parentId?: string): Promise<Message> => {
    const { data } = await api.post('/messages', { channelId, content, parentId });
    return data;
  },

  update: async (messageId: string, content: string): Promise<Message> => {
    const { data } = await api.put(`/messages/${messageId}`, { content });
    return data;
  },

  delete: async (messageId: string): Promise<void> => {
    await api.delete(`/messages/${messageId}`);
  },

  addReaction: async (messageId: string, emoji: string): Promise<void> => {
    await api.post(`/messages/${messageId}/reactions`, { emoji });
  },

  search: async (workspaceId: string, query: string): Promise<Message[]> => {
    const { data } = await api.get('/messages/search', {
      params: { workspaceId, q: query },
    });
    return data;
  },
};

// Users API
export const usersApi = {
  search: async (workspaceId: string, query: string): Promise<User[]> => {
    const { data } = await api.get('/users/search', {
      params: { workspaceId, q: query },
    });
    return data;
  },

  updateProfile: async (displayName?: string, avatarUrl?: string): Promise<User> => {
    const { data } = await api.put('/users/me', { displayName, avatarUrl });
    return data;
  },
};

export default api;
