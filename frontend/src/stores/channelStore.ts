import { create } from 'zustand';
import { channelsApi } from '../services/api';
import { socketService } from '../services/socket';
import type { Channel } from '../types';

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
  fetchChannels: (workspaceId: string) => Promise<void>;
  fetchChannel: (id: string) => Promise<void>;
  createChannel: (workspaceId: string, name: string, description?: string, isPrivate?: boolean) => Promise<Channel>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  setCurrentChannel: (channel: Channel | null) => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,

  fetchChannels: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const channels = await channelsApi.getAll(workspaceId);
      set({ channels, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch channels',
        isLoading: false,
      });
    }
  },

  fetchChannel: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const channel = await channelsApi.getById(id);
      set({ currentChannel: channel, isLoading: false });
      
      // Join socket room for this channel
      socketService.joinChannel(id);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch channel',
        isLoading: false,
      });
    }
  },

  createChannel: async (workspaceId: string, name: string, description?: string, isPrivate?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const channel = await channelsApi.create(workspaceId, name, description, isPrivate);
      set((state) => ({
        channels: [...state.channels, channel],
        isLoading: false,
      }));
      return channel;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create channel',
        isLoading: false,
      });
      throw error;
    }
  },

  joinChannel: async (channelId: string) => {
    await channelsApi.join(channelId);
    // Refresh channels to update membership
    const currentChannel = get().currentChannel;
    if (currentChannel?.workspaceId) {
      await get().fetchChannels(currentChannel.workspaceId);
    }
    socketService.joinChannel(channelId);

  },

  leaveChannel: async (channelId: string) => {
    await channelsApi.leave(channelId);
    // Refresh channels to update membership
    const currentChannel = get().currentChannel;
    if (currentChannel?.workspaceId) {
      await get().fetchChannels(currentChannel.workspaceId);
    }
    socketService.leaveChannel(channelId);
    
    // Clear current channel if it's the one being left
    if (currentChannel?.id === channelId) {
      set({ currentChannel: null });
    }

  },

  setCurrentChannel: (channel: Channel | null) => {
    const previousChannel = get().currentChannel;
    
    // Leave previous channel room
    if (previousChannel) {
      socketService.leaveChannel(previousChannel.id);
    }
    
    // Join new channel room
    if (channel) {
      socketService.joinChannel(channel.id);
    }
    
    set({ currentChannel: channel });
  },
}));

// Initialize socket listeners
let listenersInitialized = false;

export const initializeChannelSocketListeners = () => {
  if (listenersInitialized) {
    console.log('[ChannelStore] Socket listeners already initialized');
    return;
  }
  
  console.log('[ChannelStore] Setting up socket listeners');

  socketService.onChannelCreated((channel) => {
    console.log('[ChannelStore] Received channel:created event', channel);
    const state = useChannelStore.getState();
    const existingChannel = state.channels.find((c) => c.id === channel.id);
    
    // Only add if not already in the list
    if (!existingChannel) {
      console.log('[ChannelStore] Adding new channel to list');
      useChannelStore.setState((state) => ({
        channels: [...state.channels, channel],
      }));
    } else {
      console.log('[ChannelStore] Channel already exists, skipping');
    }
  });
  
  listenersInitialized = true;
};

// Ensure listeners are initialized when the socket connects (and immediately if already connected)
if (typeof window !== 'undefined') {
  window.addEventListener('socket:connected', () => {
    initializeChannelSocketListeners();
  });
}

if (socketService.isConnected()) {
  initializeChannelSocketListeners();
}
