import { useCallback, useEffect, useState } from 'react';

import { chatSourceService } from '../services/chatSourceService';
import type { ChatSourceCapability } from '../types/chat-source.types';

export const useAvailableChatSources = (token: string | null) => {
  const [capabilities, setCapabilities] = useState<ChatSourceCapability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!token) {
      setCapabilities([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await chatSourceService.getCapabilities(token);
      setCapabilities(response.sources.filter((source) => (
        (source.connected && source.selectable) || source.reconnect_required
      )));
    } catch {
      setCapabilities([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  return { capabilities, isLoading, refresh };
};
