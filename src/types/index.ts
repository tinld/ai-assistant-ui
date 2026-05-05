export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  files?: AttachedFile[];
  references?: string[];
  type?: string;
}

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
