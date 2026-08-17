import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../services/api';
import { DEFAULT_CHAT_CONTEXT_SOURCES, chatContextApi } from '../services/chatContextApi';
import type {
  ChatContextChip,
  ChatContextSourceOption,
  SourceSearchResult,
} from '../types/chat-context.types';

interface TagMatch {
  start: number;
  end: number;
  query: string;
}

const TAG_PATTERN = /(^|\s)@([A-Za-z]*)$/;
const SEARCH_DEBOUNCE_MS = 250;

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `context-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getActiveTagMatch = (value: string): TagMatch | null => {
  const match = value.match(TAG_PATTERN);
  if (!match || match.index === undefined) return null;

  const prefixLength = match[1]?.length ?? 0;
  const start = match.index + prefixLength;

  return {
    start,
    end: value.length,
    query: match[2] ?? '',
  };
};

interface UseChatContextTagsOptions {
  inputValue: string;
  setInputValue: (value: string) => void;
  token?: string | null;
}

export const useChatContextTags = ({
  inputValue,
  setInputValue,
  token,
}: UseChatContextTagsOptions) => {
  const [sources, setSources] = useState<ChatContextSourceOption[]>(DEFAULT_CHAT_CONTEXT_SOURCES);
  const [contextChips, setContextChips] = useState<ChatContextChip[]>([]);
  const [activeSource, setActiveSource] = useState<ChatContextSourceOption | null>(null);
  const [sourceQuery, setSourceQuery] = useState('');
  const [results, setResults] = useState<SourceSearchResult[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState(0);

  const activeTagMatch = useMemo(() => getActiveTagMatch(inputValue), [inputValue]);

  const visibleSources = useMemo(() => {
    if (!activeTagMatch) return [];
    const query = activeTagMatch.query.toLowerCase();
    return sources.filter((source) =>
      source.tag.toLowerCase().slice(1).startsWith(query)
      || source.displayName.toLowerCase().startsWith(query)
    );
  }, [activeTagMatch, sources]);

  const isTagMenuOpen = Boolean(activeTagMatch && visibleSources.length > 0);

  useEffect(() => {
    let isMounted = true;

    const loadSources = async (): Promise<void> => {
      try {
        if (!token) return;
        const loadedSources = await chatContextApi.getSources(token);
        if (isMounted && loadedSources.length > 0) {
          setSources(loadedSources);
        }
      } catch {
        if (isMounted) {
          setSources(DEFAULT_CHAT_CONTEXT_SOURCES);
        }
      }
    };

    void loadSources();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const openSourcePicker = useCallback((source: ChatContextSourceOption): void => {
    setActiveSource(source);
    setSourceQuery('');
    setPickerError(null);
  }, []);

  const selectSource = useCallback((source: ChatContextSourceOption): void => {
    if (activeTagMatch) {
      const nextValue = `${inputValue.slice(0, activeTagMatch.start)}${source.tag} ${inputValue.slice(activeTagMatch.end)}`;
      setInputValue(nextValue);
    }

    openSourcePicker(source);
  }, [activeTagMatch, inputValue, openSourcePicker, setInputValue]);

  useEffect(() => {
    if (!activeSource) return;

    let isCurrent = true;
    const timeoutId = window.setTimeout(() => {
      const loadResults = async (): Promise<void> => {
        setIsPickerLoading(true);
        setPickerError(null);

        try {
          const response = sourceQuery.trim()
            ? await chatContextApi.search(activeSource.source, sourceQuery.trim(), token)
            : await chatContextApi.getRecent(activeSource.source, token);

          if (isCurrent) {
            setResults(response.results);
          }
        } catch (error) {
          if (!isCurrent) return;
          setResults([]);
          setPickerError(
            error instanceof ApiError && error.status === 404
              ? 'Context source endpoint is not ready yet.'
              : 'Could not load this source.'
          );
        } finally {
          if (isCurrent) {
            setIsPickerLoading(false);
          }
        }
      };

      void loadResults();
    }, sourceQuery ? SEARCH_DEBOUNCE_MS : 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeSource, sourceQuery, token]);

  const selectResult = useCallback((result: SourceSearchResult): void => {
    const source = activeSource ?? sources.find((item) => item.source === result.source);
    const tag = source?.tag ?? `@${result.source}`;

    setContextChips((current) => {
      if (current.some((chip) => chip.source === result.source && chip.referenceId === result.id)) {
        return current;
      }

      return [
        ...current,
        {
          id: createId(),
          source: result.source,
          tag,
          label: result.title,
          referenceId: result.id,
          metadata: result.metadata,
          status: 'ready',
        },
      ];
    });
    setActiveSource(null);
  }, [activeSource, sources]);

  const removeContextChip = useCallback((chipId: string): void => {
    setContextChips((current) => current.filter((chip) => chip.id !== chipId));
  }, []);

  const clearContextChips = useCallback((): void => {
    setContextChips([]);
  }, []);

  const handleTagKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (!isTagMenuOpen) return false;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedSourceIndex((current) => (current + 1) % visibleSources.length);
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedSourceIndex((current) => (current - 1 + visibleSources.length) % visibleSources.length);
      return true;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const selectedIndex = Math.min(highlightedSourceIndex, visibleSources.length - 1);
      selectSource(visibleSources[selectedIndex] ?? visibleSources[0]);
      return true;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setInputValue(inputValue.slice(0, activeTagMatch?.start ?? inputValue.length));
      return true;
    }

    return false;
  }, [
    activeTagMatch?.start,
    highlightedSourceIndex,
    inputValue,
    isTagMenuOpen,
    selectSource,
    setInputValue,
    visibleSources,
  ]);

  return {
    activeSource,
    clearContextChips,
    contextChips,
    handleTagKeyDown,
    highlightedSourceIndex: Math.min(highlightedSourceIndex, Math.max(visibleSources.length - 1, 0)),
    isPickerLoading,
    isTagMenuOpen,
    openSourcePicker,
    pickerError,
    removeContextChip,
    results,
    selectResult,
    selectSource,
    setActiveSource,
    setSourceQuery,
    sourceQuery,
    visibleSources,
  };
};
