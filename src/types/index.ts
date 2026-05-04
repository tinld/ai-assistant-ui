export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  files?: AttachedFile[];
  references?: string[];
}

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  snippet: string;
  messages: Message[];
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
}
