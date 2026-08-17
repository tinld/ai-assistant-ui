import type { ChatContextChip } from './chat-context.types';

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  files?: AttachedFile[];
  contextChips?: ChatContextChip[];
  references?: string[];
  type?: string;
}

export interface ChatConversation {
  id: string;
  backendConversationId?: string;
  topic: string;
  modelLabel: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

export interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isHistoryLoading: boolean;
  isOlderHistoryLoading: boolean;
  historyHasMore: boolean;
  historyCursor: ChatHistoryCursor | null;
  historyConversationId: string | null;
  historyRequestId: string | null;
  olderHistoryRequestId: string | null;
  historyError: string | null;
  error: string | null;
}

export interface ChatHistoryCursor {
  createdAt: string;
  _id: string;
}

export type ChatHistoryLoadMode = 'initial' | 'older';

export interface FetchChatHistoryInput {
  mode?: ChatHistoryLoadMode;
  conversationLocalId?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  conversation_id?: string;
  history: Message[];
  hasMore?: boolean;
  nextCursor?: ChatHistoryCursor | null;
}

export interface SendMessageInput {
  messageContent: string;
  contextChips?: ChatContextChip[];
  conversationId?: string;
  clientConversationId?: string;
  clientHistory?: Message[];
  chatMode?: string;
  agentId?: string;
  modelLabel?: string;
}
