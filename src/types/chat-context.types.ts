export type ChatContextSource = 'drive' | 'gmail' | 'files' | 'synced';

export type ChatContextStatus =
  | 'pending'
  | 'ready'
  | 'failed'
  | 'permission_required'
  | 'unavailable';

export interface ChatContextSourceOption {
  source: ChatContextSource;
  tag: string;
  displayName: string;
  description: string;
  isConnected?: boolean;
  connectUrl?: string;
}

export interface ChatContextChip {
  id: string;
  source: ChatContextSource;
  tag: string;
  label: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
  status: ChatContextStatus;
}

export interface SourceSearchResult {
  id: string;
  source: ChatContextSource;
  title: string;
  subtitle?: string;
  preview?: string;
  metadata?: Record<string, unknown>;
}

export interface SourceSearchResponse {
  results: SourceSearchResult[];
  nextCursor?: string | null;
}

export interface ChatContextSourcesResponse {
  sources: ChatContextSourceOption[];
}

export interface ChatContextResolveRequest {
  items: Array<{
    source: ChatContextSource;
    referenceId: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface ResolvedChatContext {
  chipId: string;
  source: ChatContextSource;
  title: string;
  content?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface ChatContextResolveResponse {
  resolved: ResolvedChatContext[];
}
