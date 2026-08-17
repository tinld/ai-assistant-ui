import { api } from './api';
import type {
  ChatContextResolveRequest,
  ChatContextResolveResponse,
  ChatContextSource,
  ChatContextSourceOption,
  ChatContextSourcesResponse,
  SourceSearchResponse,
} from '../types/chat-context.types';

export const DEFAULT_CHAT_CONTEXT_SOURCES: ChatContextSourceOption[] = [
  {
    source: 'drive',
    tag: '@Drive',
    displayName: 'Drive',
    description: 'Google Drive files',
  },
  {
    source: 'gmail',
    tag: '@Gmail',
    displayName: 'Gmail',
    description: 'Emails and threads',
  },
  {
    source: 'files',
    tag: '@Files',
    displayName: 'Files',
    description: 'Synced workspace files',
  },
];

const sourcePath = (source: ChatContextSource): string => encodeURIComponent(source);

export const chatContextApi = {
  getSources: async (token?: string | null): Promise<ChatContextSourceOption[]> => {
    const response = await api.get<ChatContextSourcesResponse>('/api/chat/context/sources', token);
    return response.sources;
  },

  getRecent: (
    source: ChatContextSource,
    token?: string | null,
    cursor?: string | null,
  ): Promise<SourceSearchResponse> => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return api.get<SourceSearchResponse>(`/api/chat/context/${sourcePath(source)}/recent${suffix}`, token);
  },

  search: (
    source: ChatContextSource,
    query: string,
    token?: string | null,
    cursor?: string | null,
  ): Promise<SourceSearchResponse> => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (cursor) params.set('cursor', cursor);
    return api.get<SourceSearchResponse>(`/api/chat/context/${sourcePath(source)}/search?${params.toString()}`, token);
  },

  resolve: (
    request: ChatContextResolveRequest,
    token?: string | null,
  ): Promise<ChatContextResolveResponse> => (
    api.post<ChatContextResolveResponse>('/api/chat/context/resolve', request, token)
  ),
};
