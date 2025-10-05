import { create } from 'zustand';
import { messagesApi } from '../services/api';
import { socketService } from '../services/socket';
import type { Message } from '../types';

interface MessageState {
  messages: Record<string, Message[]>; // channelId -> messages
  threadMessages: Record<string, Message[]>; // parentId -> messages
  isLoading: boolean;
  error: string | null;
  // internal set of seen message IDs per channel to prevent duplicates under concurrency
  seenMessageIds?: Record<string, Set<string>>;
  typingUsers: Record<string, Set<string>>; // channelId -> Set of userNames
  typingActivity: Record<string, number>; // channelId -> activity tick
  fetchMessages: (channelId: string, page?: number) => Promise<void>;
  fetchThreadMessages: (parentId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, parentId?: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  addMessageToChannel: (channelId: string, message: Message) => void;
  updateMessageInChannel: (channelId: string, message: Message) => void;
  removeMessageFromChannel: (channelId: string, messageId: string) => void;
  addTypingUser: (channelId: string, userName: string) => void;
  removeTypingUser: (channelId: string, userName: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  threadMessages: {},
  isLoading: false,
  error: null,
  seenMessageIds: {},
  typingUsers: {},
  typingActivity: {},

  fetchMessages: async (channelId: string, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messagesApi.getChannelMessages(channelId, page);
      set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: page === 1 ? response.messages : [...(state.messages[channelId] || []), ...response.messages],
        },
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch messages',
        isLoading: false,
      });
    }
  },

  fetchThreadMessages: async (parentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await messagesApi.getThreadMessages(parentId);
      set((state) => ({
        threadMessages: {
          ...state.threadMessages,
          [parentId]: messages,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch thread messages',
        isLoading: false,
      });
    }
  },

  sendMessage: async (channelId: string, content: string, parentId?: string) => {
    await messagesApi.send(channelId, content, parentId);
    // Do NOT add optimistically. Rely on socket "message:new" to avoid duplicates for the sender.
    // Returning the API result in case caller needs it for ack/UI, but state update will come via socket.
  },

  updateMessage: async (messageId: string, content: string) => {
    const message = await messagesApi.update(messageId, content);
    get().updateMessageInChannel(message.channelId, message);
  },

  deleteMessage: async (messageId: string) => {
    await messagesApi.delete(messageId);
    // Message deletion will be handled via socket event
  },

  addReaction: async (messageId: string, emoji: string) => {
    await messagesApi.addReaction(messageId, emoji);
    // Reaction update will be handled via socket event or optimistically update
  },

  addMessageToChannel: (channelId: string, message: Message) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      const seenMap = state.seenMessageIds || {};
      const seenSet = seenMap[channelId] || new Set<string>();

      // Primary: de-dup by ID
      if (seenSet.has(message.id) || existing.some((m) => m.id === message.id)) {
        return state;
      }

      // Secondary heuristic: de-dup by (userId, content, createdAt)
      const looksDuplicate = existing.some(
        (m) => m.userId === (message as any).userId && m.content === (message as any).content && (m as any).createdAt === (message as any).createdAt,
      );
      if (looksDuplicate) {
        return state;
      }

      const nextSeenMap = { ...seenMap, [channelId]: new Set(seenSet).add(message.id) };
      return {
        messages: {
          ...state.messages,
          [channelId]: [...existing, message],
        },
        seenMessageIds: nextSeenMap,
      };
    });
  },

  updateMessageInChannel: (channelId: string, updatedMessage: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] || []).map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        ),
      },
    }));
  },

  removeMessageFromChannel: (channelId: string, messageId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] || []).filter((msg) => msg.id !== messageId),
      },
    }));
  },

  addTypingUser: (channelId: string, userName: string) => {
    set((state) => {
      const channelTyping = new Set(state.typingUsers[channelId] || []);
      channelTyping.add(userName);
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: channelTyping,
        },
        typingActivity: {
          ...state.typingActivity,
          [channelId]: (state.typingActivity[channelId] || 0) + 1,
        },
      };
    });
  },

  removeTypingUser: (channelId: string, userName: string) => {
    set((state) => {
      const channelTyping = new Set(state.typingUsers[channelId] || []);
      channelTyping.delete(userName);
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: channelTyping,
        },
        typingActivity: {
          ...state.typingActivity,
          [channelId]: (state.typingActivity[channelId] || 0) + 1,
        },
      };
    });
  },
}));

// Initialize socket listeners
let listenersInitialized = false;

export const initializeMessageSocketListeners = () => {
  if (listenersInitialized) {
    console.log('[MessageStore] Socket listeners already initialized');
    return;
  }
  
  console.log('[MessageStore] Setting up socket listeners');
  // Defensive: remove any existing listeners (e.g., after HMR) before re-registering
  socketService.off('message:new');
  socketService.off('message:updated');
  socketService.off('message:deleted');
  socketService.off('typing:start');
  socketService.off('typing:stop');
  
  socketService.onMessageNew((message) => {
    console.log('[MessageStore] Received message:new event', message);
    const state = useMessageStore.getState();
    const channelMessages = state.messages[message.channelId] || [];
    
    // Check if message already exists (avoid duplicates for sender)
    const exists = channelMessages.some((m) => m.id === message.id);
    if (!exists) {
      useMessageStore.getState().addMessageToChannel(message.channelId, message);
    }

    // If this is a thread reply, also reflect it in threadMessages cache if present
    if (message.parentId) {
      const current = useMessageStore.getState().threadMessages[message.parentId] || [];
      const alreadyThere = current.some((m) => m.id === message.id);
      if (!alreadyThere) {
        useMessageStore.setState((prev) => ({
          threadMessages: {
            ...prev.threadMessages,
            [message.parentId!]: [...current, message],
          },
        }));
      }
    }
  });

  socketService.onMessageUpdated((message) => {
    console.log('[MessageStore] Received message:updated event', message);
    useMessageStore.getState().updateMessageInChannel(message.channelId, message);
  });

  socketService.onMessageDeleted((data) => {
    console.log('[MessageStore] Received message:deleted event', data);
    useMessageStore.getState().removeMessageFromChannel(data.channelId, data.messageId);
  });

  socketService.onTypingStart((data) => {
    useMessageStore.getState().addTypingUser(data.channelId, data.userName);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      useMessageStore.getState().removeTypingUser(data.channelId, data.userName);
    }, 3000);
  });

  socketService.onTypingStop((data) => {
    const channels = useMessageStore.getState().messages;
    const channelId = Object.keys(channels).find((cId) => 
      channels[cId]?.some((m) => m.userId === data.userId)
    );
    if (channelId) {
      // We don't have userName here, so we'd need to track it differently
      // For now, this is a simplified version
    }
  });
  
  listenersInitialized = true;
};

// Ensure listeners are initialized when the socket connects (and immediately if already connected)
if (typeof window !== 'undefined') {
  window.addEventListener('socket:connected', () => {
    initializeMessageSocketListeners();
  });
}

if (socketService.isConnected()) {
  initializeMessageSocketListeners();
}
