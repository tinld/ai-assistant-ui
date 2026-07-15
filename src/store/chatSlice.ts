import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { CHAT_CACHED_MESSAGE_LIMIT, CHAT_HISTORY_PAGE_SIZE } from '../constants/chat.constants';
import { api, ApiError } from '../services/api';
import type { RootState } from './index';
import type {
  ChatConversation,
  ChatHistoryResponse,
  ChatState,
  FetchChatHistoryInput,
  Message,
  SendMessageInput,
} from '../types/chat.types';

const CONVERSATIONS_STORAGE_KEY = 'ai-concierge-chat-conversations';
const ACTIVE_CONVERSATION_STORAGE_KEY = 'ai-concierge-active-chat-id';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const nowIso = (): string => new Date().toISOString();

const getConversationTopic = (messages: Message[], fallback = 'New chat'): string => {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content.trim();
  if (!firstUserMessage) return fallback;
  return firstUserMessage.length > 48 ? `${firstUserMessage.slice(0, 48)}...` : firstUserMessage;
};

const ensureMessageIdentity = (message: Message): Message => {
  if (message.id && message.timestamp) {
    return message;
  }

  return {
    ...message,
    id: message.id ?? createId(),
    timestamp: message.timestamp ?? nowIso(),
  };
};

const normalizeMessages = (messages: Message[]): Message[] => messages.map(ensureMessageIdentity);

const createConversation = (values: Partial<ChatConversation> = {}): ChatConversation => {
  const timestamp = nowIso();

  return {
    id: values.id ?? createId(),
    backendConversationId: values.backendConversationId,
    topic: values.topic ?? getConversationTopic(values.messages ?? []),
    modelLabel: values.modelLabel ?? 'Default agent',
    agentId: values.agentId,
    createdAt: values.createdAt ?? timestamp,
    updatedAt: values.updatedAt ?? timestamp,
    messages: normalizeMessages(values.messages ?? []),
  };
};

const readStoredConversations = (): { conversations: ChatConversation[]; activeConversationId: string | null } => {
  if (typeof localStorage === 'undefined') {
    return { conversations: [], activeConversationId: null };
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(CONVERSATIONS_STORAGE_KEY) ?? '[]') as ChatConversation[];
    const conversations = Array.isArray(parsed)
      ? parsed
          .filter((conversation) => conversation?.id && Array.isArray(conversation.messages))
          .map((conversation) => ({
            ...conversation,
            messages: normalizeMessages(conversation.messages.slice(-CHAT_CACHED_MESSAGE_LIMIT)),
            backendConversationId: conversation.backendConversationId,
            topic: conversation.topic || getConversationTopic(conversation.messages),
            modelLabel: conversation.modelLabel || 'Default agent',
            createdAt: conversation.createdAt || nowIso(),
            updatedAt: conversation.updatedAt || conversation.createdAt || nowIso(),
          }))
      : [];
    const storedActiveId = localStorage.getItem(ACTIVE_CONVERSATION_STORAGE_KEY);
    const activeConversationId = conversations.some((conversation) => conversation.id === storedActiveId)
      ? storedActiveId
      : conversations[0]?.id ?? null;

    return { conversations, activeConversationId };
  } catch {
    return { conversations: [], activeConversationId: null };
  }
};

const getActiveConversation = (state: ChatState): ChatConversation | undefined =>
  state.conversations.find((conversation) => conversation.id === state.activeConversationId);

const getConversation = (state: ChatState, conversationId?: string): ChatConversation | undefined =>
  conversationId
    ? state.conversations.find((conversation) => conversation.id === conversationId)
    : getActiveConversation(state);

const mergeOlderMessages = (currentMessages: Message[], olderMessages: Message[]): Message[] => {
  const knownIds = new Set(currentMessages.map((message) => message.id).filter(Boolean));
  const uniqueOlderMessages = olderMessages.filter((message) => !message.id || !knownIds.has(message.id));
  return [...uniqueOlderMessages, ...currentMessages];
};

const resetHistoryPagination = (state: ChatState): void => {
  state.isHistoryLoading = false;
  state.isOlderHistoryLoading = false;
  state.historyHasMore = false;
  state.historyCursor = null;
  state.historyConversationId = null;
  state.historyRequestId = null;
  state.olderHistoryRequestId = null;
  state.historyError = null;
};

const ensureActiveConversation = (state: ChatState): ChatConversation => {
  const activeConversation = getActiveConversation(state);
  if (activeConversation) return activeConversation;

  const conversation = createConversation();
  state.conversations.unshift(conversation);
  state.activeConversationId = conversation.id;
  return conversation;
};

const appendMessageToActiveConversation = (state: ChatState, message: Message, modelLabel?: string, agentId?: string): void => {
  const activeConversation = ensureActiveConversation(state);
  const timestamp = nowIso();

  activeConversation.messages.push(ensureMessageIdentity({
    ...message,
    timestamp: message.timestamp ?? timestamp,
  }));
  activeConversation.topic = getConversationTopic(activeConversation.messages, activeConversation.topic);
  activeConversation.modelLabel = modelLabel ?? activeConversation.modelLabel;
  activeConversation.agentId = agentId ?? activeConversation.agentId;
  activeConversation.updatedAt = timestamp;
};

const storedState = readStoredConversations();

const initialState: ChatState = {
  conversations: storedState.conversations,
  activeConversationId: storedState.activeConversationId,
  isLoading: false,
  isHistoryLoading: false,
  isOlderHistoryLoading: false,
  historyHasMore: false,
  historyCursor: null,
  historyConversationId: null,
  historyRequestId: null,
  olderHistoryRequestId: null,
  historyError: null,
  error: null,
};

export const fetchHistory = createAsyncThunk(
  'chat/fetchHistory',
  async (input: FetchChatHistoryInput = {}, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) return rejectWithValue('No token');
    const loadMode = input.mode ?? 'initial';
    const conversation = getConversation(state.chat, input.conversationLocalId);
    const localConversationId = conversation?.id;

    try {
      if (conversation && !conversation.backendConversationId) {
        return {
          success: true,
          conversation_id: undefined,
          history: conversation.messages,
          hasMore: false,
          nextCursor: null,
          loadMode,
          localConversationId,
        };
      }

      const query = new URLSearchParams({ limit: String(CHAT_HISTORY_PAGE_SIZE) });
      if (conversation?.backendConversationId) {
        query.set('conversation_id', conversation.backendConversationId);
      }
      if (loadMode === 'older' && state.chat.historyConversationId === localConversationId) {
        const cursor = state.chat.historyCursor;
        if (cursor) {
          query.set('beforeCreatedAt', cursor.createdAt);
          query.set('beforeId', cursor._id);
        }
      }

      const response = await api.get<ChatHistoryResponse>(`/api/chat/history?${query.toString()}`, token);
      return { ...response, loadMode, localConversationId };
    } catch (err: unknown) {
      if (err instanceof ApiError) return rejectWithValue(err.message);
      return rejectWithValue('Failed to fetch history');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (input: string | SendMessageInput, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) return rejectWithValue('No token');
    const messageContent = typeof input === 'string' ? input : input.messageContent;
    const agentId = typeof input === 'string' ? undefined : input.agentId;
    const modelLabel = typeof input === 'string' ? undefined : input.modelLabel;
    const chatMode = typeof input === 'string' ? undefined : input.chatMode;
    const sources = typeof input === 'string' ? undefined : input.sources;
    const activeConversation = getActiveConversation(state.chat);
    const conversationId = typeof input === 'string'
      ? activeConversation?.backendConversationId
      : input.conversationId ?? activeConversation?.backendConversationId;
    const clientConversationId = typeof input === 'string'
      ? activeConversation?.id
      : input.clientConversationId ?? activeConversation?.id;
    const localHistory = activeConversation?.backendConversationId
      ? undefined
      : activeConversation?.messages.slice(-21);
    const lastLocalHistoryMessage = localHistory?.[localHistory.length - 1];
    const clientHistory = localHistory && lastLocalHistoryMessage?.role === 'user' && lastLocalHistoryMessage.content === messageContent
      ? localHistory.slice(0, -1)
      : localHistory;
    const requestBody = {
      message: messageContent,
      ...(agentId ? { agent_id: agentId } : {}),
      ...(chatMode ? { chat_mode: chatMode } : {}),
      ...(conversationId ? { conversation_id: conversationId } : {}),
      ...(clientConversationId ? { client_conversation_id: clientConversationId } : {}),
      ...(clientHistory?.length ? { client_history: clientHistory.slice(-20) } : {}),
      ...(sources?.length ? { sources } : {}),
    };

    try {
      const response = await api.post<{
        success: boolean;
        response: string;
        conversation_id?: string;
        user_message: string | Message;
        assistant_message?: Message;
        messages?: Message[];
      }>('/api/chat', requestBody, token);
      return { ...response, agentId, modelLabel };
    } catch (err: unknown) {
      if (err instanceof ApiError) return rejectWithValue(err.message);
      return rejectWithValue('Failed to send message');
    }
  }
);

export const clearChat = createAsyncThunk(
  'chat/clearChat',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) return rejectWithValue('No token');

    try {
      const activeConversation = getActiveConversation(state.chat);
      const endpoint = activeConversation?.backendConversationId
        ? `/api/chat/history?conversation_id=${encodeURIComponent(activeConversation.backendConversationId)}`
        : '/api/chat/history';
      await api.delete<{ success: boolean }>(endpoint, token);
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiError) return rejectWithValue(err.message);
      return rejectWithValue('Failed to clear chat');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addLocalMessage: (state, action: PayloadAction<Message & { modelLabel?: string; agentId?: string }>) => {
      appendMessageToActiveConversation(state, action.payload, action.payload.modelLabel, action.payload.agentId);
    },
    createChatConversation: (state, action: PayloadAction<{ modelLabel?: string; agentId?: string } | undefined>) => {
      const existingEmptyConversation = state.conversations.find((conversation) => conversation.messages.length === 0);
      if (existingEmptyConversation) {
        existingEmptyConversation.modelLabel = action.payload?.modelLabel ?? existingEmptyConversation.modelLabel;
        existingEmptyConversation.agentId = action.payload?.agentId ?? existingEmptyConversation.agentId;
        existingEmptyConversation.updatedAt = nowIso();
        state.activeConversationId = existingEmptyConversation.id;
        state.error = null;
        resetHistoryPagination(state);
        return;
      }

      const conversation = createConversation({
        modelLabel: action.payload?.modelLabel,
        agentId: action.payload?.agentId,
      });
      state.conversations.unshift(conversation);
      state.activeConversationId = conversation.id;
      state.error = null;
      resetHistoryPagination(state);
    },
    selectChatConversation: (state, action: PayloadAction<string>) => {
      if (!state.conversations.some((conversation) => conversation.id === action.payload)) return;

      state.activeConversationId = action.payload;
      state.error = null;
      resetHistoryPagination(state);
    },
    renameChatConversation: (state, action: PayloadAction<{ id: string; topic: string }>) => {
      const topic = action.payload.topic.trim();
      if (!topic) return;

      const conversation = state.conversations.find((item) => item.id === action.payload.id);
      if (!conversation) return;

      conversation.topic = topic;
      conversation.updatedAt = nowIso();
    },
    deleteChatConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter((conversation) => conversation.id !== action.payload);

      if (state.activeConversationId === action.payload) {
        const nextConversation = state.conversations[0] ?? createConversation();
        if (state.conversations.length === 0) {
          state.conversations.push(nextConversation);
        }
        state.activeConversationId = nextConversation.id;
      }

      state.error = null;
      resetHistoryPagination(state);
    },
    clearActiveConversation: (state) => {
      const activeConversation = ensureActiveConversation(state);
      activeConversation.messages = [];
      activeConversation.topic = 'New chat';
      activeConversation.updatedAt = nowIso();
      state.error = null;
      resetHistoryPagination(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state, action) => {
        const loadMode = action.meta.arg?.mode ?? 'initial';
        state.historyError = null;
        if (loadMode === 'older') {
          state.isOlderHistoryLoading = true;
          state.olderHistoryRequestId = action.meta.requestId;
        } else {
          state.isHistoryLoading = true;
          state.historyRequestId = action.meta.requestId;
        }
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        const loadMode = action.payload.loadMode;
        const isCurrentRequest = loadMode === 'older'
          ? state.olderHistoryRequestId === action.meta.requestId
          : state.historyRequestId === action.meta.requestId;
        if (!isCurrentRequest) return;

        if (loadMode === 'older') {
          state.isOlderHistoryLoading = false;
          state.olderHistoryRequestId = null;
        } else {
          state.isHistoryLoading = false;
          state.historyRequestId = null;
        }

        if (state.conversations.length === 0 && action.payload?.history?.length) {
          const conversation = createConversation({
            backendConversationId: action.payload.conversation_id,
            topic: getConversationTopic(action.payload.history),
            messages: action.payload.history,
          });
          state.conversations.push(conversation);
          state.activeConversationId = conversation.id;
        }

        if (state.conversations.length === 0) {
          const conversation = createConversation();
          state.conversations.push(conversation);
          state.activeConversationId = conversation.id;
        }

        const targetConversation = getConversation(state, action.payload.localConversationId);
        if (targetConversation) {
          if (action.payload.conversation_id) {
            targetConversation.backendConversationId = action.payload.conversation_id;
          }
          const historyMessages = normalizeMessages(action.payload.history ?? []);
          targetConversation.messages = loadMode === 'older'
            ? mergeOlderMessages(targetConversation.messages, historyMessages)
            : historyMessages;
          targetConversation.topic = getConversationTopic(targetConversation.messages, targetConversation.topic);
        }

        state.historyConversationId = targetConversation?.id ?? state.activeConversationId;
        state.historyHasMore = Boolean(action.payload.hasMore);
        state.historyCursor = action.payload.nextCursor ?? null;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        const loadMode = action.meta.arg?.mode ?? 'initial';
        const isCurrentRequest = loadMode === 'older'
          ? state.olderHistoryRequestId === action.meta.requestId
          : state.historyRequestId === action.meta.requestId;
        if (!isCurrentRequest) return;

        if (loadMode === 'older') {
          state.isOlderHistoryLoading = false;
          state.olderHistoryRequestId = null;
        } else {
          state.isHistoryLoading = false;
          state.historyRequestId = null;
        }
        state.historyError = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const activeConversation = ensureActiveConversation(state);
        if (action.payload.conversation_id) {
          activeConversation.backendConversationId = action.payload.conversation_id;
        }
        appendMessageToActiveConversation(
          state,
          action.payload.assistant_message ?? {
            role: 'assistant',
            content: action.payload.response,
          },
          action.payload.modelLabel,
          action.payload.agentId
        );
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(clearChat.fulfilled, (state) => {
        const activeConversation = ensureActiveConversation(state);
        activeConversation.messages = [];
        activeConversation.topic = 'New chat';
        activeConversation.updatedAt = nowIso();
        resetHistoryPagination(state);
      });
  },
});

export const {
  addLocalMessage,
  createChatConversation,
  selectChatConversation,
  renameChatConversation,
  deleteChatConversation,
  clearActiveConversation,
} = chatSlice.actions;
export { CONVERSATIONS_STORAGE_KEY, ACTIVE_CONVERSATION_STORAGE_KEY };
export default chatSlice.reducer;

