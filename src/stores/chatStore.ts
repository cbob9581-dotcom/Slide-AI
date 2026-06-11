import { create } from 'zustand';
import type { Message, Conversation } from '../types';

interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  streamingMessageId: string | null;
  streamingContent: string;

  setActiveConversation: (docId: string) => void;
  getMessages: () => Message[];
  addMessage: (msg: Omit<Message, 'id' | 'createdAt'>) => string;
  updateMessage: (id: string, content: string) => void;
  startStreaming: (id: string) => void;
  appendStreaming: (id: string, chunk: string) => void;
  stopStreaming: () => void;
  clearConversation: (docId: string) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  activeConversationId: null,
  streamingMessageId: null,
  streamingContent: '',

  setActiveConversation: (docId) => {
    const state = get();
    if (!state.conversations[docId]) {
      set({
        conversations: {
          ...state.conversations,
          [docId]: { id: docId, documentId: docId, messages: [] },
        },
        activeConversationId: docId,
      });
    } else {
      set({ activeConversationId: docId });
    }
  },

  getMessages: () => {
    const { conversations, activeConversationId } = get();
    if (!activeConversationId) return [];
    return conversations[activeConversationId]?.messages ?? [];
  },

  addMessage: (msg) => {
    const { conversations, activeConversationId } = get();
    if (!activeConversationId) return '';
    const id = generateId();
    const newMsg: Message = { ...msg, id, createdAt: Date.now() };
    set({
      conversations: {
        ...conversations,
        [activeConversationId]: {
          ...conversations[activeConversationId],
          messages: [
            ...(conversations[activeConversationId]?.messages ?? []),
            newMsg,
          ],
        },
      },
    });
    return id;
  },

  updateMessage: (id, content) => {
    const { conversations, activeConversationId } = get();
    if (!activeConversationId) return;
    set({
      conversations: {
        ...conversations,
        [activeConversationId]: {
          ...conversations[activeConversationId],
          messages: conversations[activeConversationId].messages.map((m) =>
            m.id === id ? { ...m, content } : m
          ),
        },
      },
    });
  },

  startStreaming: (id) =>
    set({ streamingMessageId: id, streamingContent: '' }),

  appendStreaming: (id, chunk) =>
    set((state) => {
      const newContent = state.streamingContent + chunk;
      // 同时更新消息
      const { conversations, activeConversationId } = state;
      if (!activeConversationId) return { streamingContent: newContent };
      return {
        streamingContent: newContent,
        conversations: {
          ...conversations,
          [activeConversationId]: {
            ...conversations[activeConversationId],
            messages: conversations[activeConversationId].messages.map((m) =>
              m.id === id ? { ...m, content: newContent } : m
            ),
          },
        },
      };
    }),

  stopStreaming: () =>
    set({ streamingMessageId: null, streamingContent: '' }),

  clearConversation: (docId) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [docId]: { id: docId, documentId: docId, messages: [] },
      },
    })),
}));
