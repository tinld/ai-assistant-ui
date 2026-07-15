import React from 'react';
import { FileText, Mail } from 'lucide-react';

import type { ChatSourceProvider } from '../../types/chat-source.types';

interface ChatSourceIconProps {
  provider: ChatSourceProvider;
  className?: string;
}

export const ChatSourceIcon: React.FC<ChatSourceIconProps> = ({ provider, className = 'h-4 w-4' }) => {
  if (provider === 'google_drive') {
    return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">add_to_drive</span>;
  }
  if (provider === 'gmail') return <Mail className={className} aria-hidden="true" />;
  return <FileText className={className} aria-hidden="true" />;
};
