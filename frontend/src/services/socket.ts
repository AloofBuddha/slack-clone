import { io, Socket } from 'socket.io-client';
import type { Message, User } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected, skipping');
      return;
    }

    console.log('[Socket] Connecting to', WS_URL);
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected successfully');
      this.reconnectAttempts = 0;
      
      // Emit a custom event that stores can listen to
      window.dispatchEvent(new CustomEvent('socket:connected'));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Channel events
  joinChannel(channelId: string) {
    this.socket?.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', { channelId });
  }

  // Typing events
  startTyping(channelId: string, userName: string) {
    this.socket?.emit('typing:start', { channelId, userName });
  }

  stopTyping(channelId: string) {
    this.socket?.emit('typing:stop', { channelId });
  }

  // Message listeners
  onMessageNew(callback: (message: Message) => void) {
    if (!this.socket) {
      console.warn('[Socket] Cannot register onMessageNew - socket not initialized');
      return;
    }
    console.log('[Socket] Registering onMessageNew listener');
    this.socket.on('message:new', callback);
  }

  onMessageUpdated(callback: (message: Message) => void) {
    if (!this.socket) {
      console.warn('[Socket] Cannot register onMessageUpdated - socket not initialized');
      return;
    }
    console.log('[Socket] Registering onMessageUpdated listener');
    this.socket.on('message:updated', callback);
  }

  onMessageDeleted(callback: (data: { messageId: string; channelId: string }) => void) {
    if (!this.socket) {
      console.warn('[Socket] Cannot register onMessageDeleted - socket not initialized');
      return;
    }
    console.log('[Socket] Registering onMessageDeleted listener');
    this.socket.on('message:deleted', callback);
  }

  // Typing listeners
  onTypingStart(callback: (data: { userId: string; userName: string; channelId: string }) => void) {
    this.socket?.on('typing:start', callback);
  }

  onTypingStop(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('typing:stop', callback);
  }

  // Presence listeners
  onUserPresence(callback: (data: { userId: string; status: User['status'] }) => void) {
    this.socket?.on('user:presence', callback);
  }

  // Channel listeners
  onChannelCreated(callback: (channel: any) => void) {
    this.socket?.on('channel:created', callback);
  }

  // Remove listeners
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get the raw socket for debugging
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).socketService = socketService;
}
