export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  files?: AttachedFile[];
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
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageInput {
  messageContent: string;
  conversationId?: string;
  clientConversationId?: string;
  clientHistory?: Message[];
  chatMode?: string;
  agentId?: string;
  modelLabel?: string;
}
