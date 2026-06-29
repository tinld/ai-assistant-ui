import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  Command,
  Database,
  FileText,
  Check,
  ChevronDown,
  Layers3,
  Lightbulb,
  LoaderCircle,
  MessageSquarePlus,
  Mic,
  MoreHorizontal,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  RotateCcw,
  X,
} from 'lucide-react';
import type { RootState, AppDispatch } from '../store';
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  CONVERSATIONS_STORAGE_KEY,
  addLocalMessage,
  clearChat,
  createChatConversation,
  deleteChatConversation,
  fetchHistory,
  renameChatConversation,
  selectChatConversation,
  sendMessage,
} from '../store/chatSlice';
import { toggleRecentConversations } from '../store/appSlice';
import {
  CHAT_BOTTOM_THRESHOLD_PX,
  CHAT_CACHED_MESSAGE_LIMIT,
  CHAT_HISTORY_SCROLL_THRESHOLD_PX,
} from '../constants/chat.constants';
import { CHAT_ATTACHMENT_ACCEPT, CHAT_ATTACHMENT_MAX_SIZE_LABEL } from '../constants/file.constants';
import { ChatAttachmentChip } from '../components/ChatAttachmentChip';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { useChatAttachment } from '../hooks/useChatAttachment';
import { api } from '../services/api';
import { agentApi } from '../services/agentApi';
import type { AgentProfile } from '../types/agent.types';
import type { Message } from '../types/chat.types';
import { formatBytes } from '../utils/formatters';

const starterPrompts = [
  {
    title: 'Executive summary',
    prompt: 'Summarize the most important points and recommend the next action.',
    icon: Sparkles,
  },
  {
    title: 'Compare options',
    prompt: 'Compare these options side by side with risks, tradeoffs, and a recommendation.',
    icon: Layers3,
  },
  {
    title: 'Find evidence',
    prompt: 'Research this topic and separate facts, assumptions, and open questions.',
    icon: Search,
  },
  {
    title: 'Build workflow',
    prompt: 'Turn this into a step-by-step execution plan with owners and checkpoints.',
    icon: CheckCircle2,
  },
];

const commandSuggestions = [
  { cmd: '/facts', icon: Brain, desc: 'Add durable knowledge for the assistant.' },
  { cmd: '/settings', icon: Wand2, desc: 'Tune assistant behavior and response style.' },
  { cmd: '/prompt', icon: FileText, desc: 'Add a reusable behavior rule.' },
  { cmd: '/rules', icon: ShieldCheck, desc: 'Review active behavior rules.' },
  { cmd: '/clear', icon: Trash2, desc: 'Clear the current conversation context.' },
];

const chatModeOptions = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Classify',
    icon: Wand2,
  },
  {
    value: 'general',
    label: 'Web',
    description: 'Search',
    icon: Search,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'KB',
    icon: Database,
  },
] as const;

const assistantQuickActions = [
  { label: 'Summarize', icon: Sparkles, prompt: 'Summarize the previous answer.' },
  { label: 'Explain', icon: Lightbulb, prompt: 'Explain the previous answer more simply.' },
] as const;

const formatMessageTime = (timestamp?: string): string => {
  if (!timestamp) return 'Now';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Now';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatConversationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

interface AssistantResponseProps {
  message: Message;
  onUsePrompt: (prompt: string) => void;
  assistantLabel: string;
}

const AssistantResponse = memo(function AssistantResponse({ message, onUsePrompt, assistantLabel }: AssistantResponseProps) {
  return (
    <article className="group flex w-full max-w-[44rem] items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-teal-600 text-white shadow-lg shadow-violet-500/20">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1 rounded-xl rounded-tl-md border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-black/30">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-violet-700 dark:text-violet-300">{assistantLabel}</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
        <div className="prose prose-sm max-w-none text-[13px] text-slate-700 dark:prose-invert dark:text-slate-200">
          <MarkdownMessage content={message.content} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200/70 pt-2.5 dark:border-slate-800">
          {assistantQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => onUsePrompt(action.prompt)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:border-violet-300 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:text-violet-300"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}, (previousProps, nextProps) => (
  previousProps.message === nextProps.message
  && previousProps.assistantLabel === nextProps.assistantLabel
));

interface UserMessageProps {
  message: Message;
  fallbackInitial: string;
}

const UserMessage = memo(function UserMessage({ message, fallbackInitial }: UserMessageProps) {
  return (
    <article className="flex w-full justify-end">
      <div className="flex max-w-[44rem] flex-row-reverse items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold uppercase text-white shadow-lg shadow-slate-900/15 dark:bg-slate-100 dark:text-slate-900">
          {fallbackInitial}
        </div>
        <div className="rounded-xl rounded-tr-md bg-slate-900 px-3.5 py-2.5 text-[13px] leading-6 text-white shadow-[0_12px_32px_rgba(15,23,42,0.14)] dark:bg-slate-100 dark:text-slate-950">
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.files?.map((file) => (
            <div key={`${file.name}-${file.size}`} className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2 text-xs dark:bg-slate-900/10">
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
              <span className="shrink-0 opacity-70">{file.size}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}, (previousProps, nextProps) => (
  previousProps.message === nextProps.message
  && previousProps.fallbackInitial === nextProps.fallbackInitial
));

export const Chat: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    conversations,
    activeConversationId,
    isLoading,
    isHistoryLoading,
    isOlderHistoryLoading,
    historyHasMore,
    historyError,
    error,
  } = useSelector((state: RootState) => state.chat);
  const isRecentConversationsOpen = useSelector((state: RootState) => state.app.isRecentConversationsOpen);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const {
    attachment,
    fileInputRef,
    isAttachmentBusy,
    openFilePicker,
    clearAttachment,
    handleFileSelection,
  } = useChatAttachment(token);

  const [inputValue, setInputValue] = useState('');
  const [chatMode, setChatMode] = useState('auto');
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(false);
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState('');
  const [isAgentPickerOpen, setIsAgentPickerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentPickerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isPrependingHistoryRef = useRef(false);
  const historyRequestPendingRef = useRef(false);
  const shouldScrollToBottomRef = useRef(true);
  const previousScrollTopRef = useRef(0);
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.agent_id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );
  const selectedChatMode = useMemo(
    () => chatModeOptions.find((mode) => mode.value === chatMode) ?? chatModeOptions[0],
    [chatMode]
  );
  const SelectedChatModeIcon = selectedChatMode.icon;
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );
  const messages = activeConversation?.messages ?? [];
  const lastUserMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === 'user') {
        return messages[index];
      }
    }

    return null;
  }, [messages]);

  useEffect(() => {
    const cachedConversations = conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.slice(-CHAT_CACHED_MESSAGE_LIMIT),
    }));
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(cachedConversations));

    if (activeConversationId) {
      localStorage.setItem(ACTIVE_CONVERSATION_STORAGE_KEY, activeConversationId);
    } else {
      localStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    dispatch(fetchHistory({ mode: 'initial' }));

    const checkSettings = async () => {
      try {
        if (!token) return;
        const res = await api.get<{ data: { settings: { enable_prompt_logging?: boolean } } }>('/api/settings', token);
        if (res?.data?.settings?.enable_prompt_logging) {
          setIsLoggingEnabled(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkSettings();
  }, [dispatch, token]);

  useEffect(() => {
    const loadAgents = async (): Promise<void> => {
      try {
        if (!token) return;
        const loadedAgents = await agentApi.getAgents(token);
        const activeAgent = loadedAgents.find((agent) => agent.is_active) ?? loadedAgents[0];
        setAgents(loadedAgents);
        setSelectedAgentId(activeAgent?.agent_id ?? '');
      } catch (agentError) {
        console.error(agentError);
      }
    };

    void loadAgents();
  }, [token]);

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isAgentPickerOpen) return;

    const handlePointerDown = (event: MouseEvent): void => {
      if (!agentPickerRef.current?.contains(event.target as Node)) {
        setIsAgentPickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsAgentPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAgentPickerOpen]);

  useEffect(() => {
    if (isPrependingHistoryRef.current) return;
    if (!shouldScrollToBottomRef.current && !isNearBottomRef.current) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: shouldScrollToBottomRef.current ? 'auto' : 'smooth',
    });
    shouldScrollToBottomRef.current = false;
  }, [activeConversationId, isHistoryLoading, isLoading, messages.length]);

  const loadOlderHistory = async (container: HTMLDivElement): Promise<void> => {
    if (!activeConversationId || !historyHasMore || isHistoryLoading || isOlderHistoryLoading) return;
    if (historyRequestPendingRef.current) return;

    historyRequestPendingRef.current = true;
    isPrependingHistoryRef.current = true;
    const previousScrollHeight = container.scrollHeight;
    const previousScrollTop = container.scrollTop;

    try {
      await dispatch(fetchHistory({
        mode: 'older',
        conversationLocalId: activeConversationId,
      })).unwrap();

      requestAnimationFrame(() => {
        container.scrollTop = previousScrollTop + container.scrollHeight - previousScrollHeight;
        previousScrollTopRef.current = container.scrollTop;
        isPrependingHistoryRef.current = false;
        historyRequestPendingRef.current = false;
      });
    } catch {
      isPrependingHistoryRef.current = false;
      historyRequestPendingRef.current = false;
    }
  };

  const handleMessagesScroll = (): void => {
    const container = messagesScrollRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isScrollingUp = container.scrollTop < previousScrollTopRef.current;
    previousScrollTopRef.current = container.scrollTop;
    isNearBottomRef.current = distanceFromBottom <= CHAT_BOTTOM_THRESHOLD_PX;

    if (isScrollingUp && container.scrollTop <= CHAT_HISTORY_SCROLL_THRESHOLD_PX) {
      void loadOlderHistory(container);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();
    const readyAttachment = attachment?.status === 'ready' ? attachment : null;
    setInputValue('');
    shouldScrollToBottomRef.current = true;

    dispatch(addLocalMessage({
      role: 'user',
      content: messageContent,
      files: readyAttachment ? [{
        name: readyAttachment.name,
        size: formatBytes(readyAttachment.size),
        type: readyAttachment.type,
      }] : undefined,
      agentId: selectedAgentId || undefined,
      modelLabel: selectedAgent?.name ?? 'Default agent',
    }));

    dispatch(sendMessage({
      messageContent,
      chatMode,
      agentId: selectedAgentId || undefined,
      modelLabel: selectedAgent?.name ?? 'Default agent',
    }));

    if (readyAttachment) clearAttachment();
  };

  const handleUsePrompt = (prompt: string): void => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      dispatch(clearChat());
    }
  };

  const handleNewChat = (): void => {
    dispatch(createChatConversation({
      agentId: selectedAgentId || undefined,
      modelLabel: selectedAgent?.name ?? 'Default agent',
    }));
    setInputValue('');
    setOpenConversationMenuId(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRetryLastMessage = (): void => {
    if (!lastUserMessage?.content || isLoading) return;

    dispatch(sendMessage({
      messageContent: lastUserMessage.content,
      chatMode,
      agentId: selectedAgentId || undefined,
      modelLabel: selectedAgent?.name ?? activeConversation?.modelLabel ?? 'Default agent',
    }));
  };

  const handleSelectConversation = (conversationId: string): void => {
    shouldScrollToBottomRef.current = true;
    isNearBottomRef.current = true;
    previousScrollTopRef.current = 0;
    dispatch(selectChatConversation(conversationId));
    dispatch(fetchHistory({ mode: 'initial', conversationLocalId: conversationId }));
    setOpenConversationMenuId(null);
    setEditingConversationId(null);
  };

  const handleStartRename = (conversationId: string, topic: string): void => {
    setEditingConversationId(conversationId);
    setEditingTopic(topic);
    setOpenConversationMenuId(null);
  };

  const handleSaveRename = (): void => {
    if (!editingConversationId) return;

    dispatch(renameChatConversation({
      id: editingConversationId,
      topic: editingTopic,
    }));
    setEditingConversationId(null);
    setEditingTopic('');
  };

  const handleDeleteConversation = (conversationId: string): void => {
    if (!window.confirm('Delete this conversation?')) return;

    dispatch(deleteChatConversation(conversationId));
    setOpenConversationMenuId(null);
    setEditingConversationId(null);
  };

  const visibleCommands = commandSuggestions.filter((command) =>
    command.cmd.startsWith(inputValue.split(' ')[0])
  );
  const userInitial = user?.full_name?.[0] || user?.email?.[0] || 'U';
  const assistantLabel = activeConversation?.modelLabel ?? selectedAgent?.name ?? 'Default agent';
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <aside className={`hidden min-h-0 shrink-0 flex-col border-r border-white/70 bg-white/72 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/72 lg:flex ${isRecentConversationsOpen ? 'w-64' : 'w-14'}`}>
        <div className={`flex h-14 shrink-0 items-center border-b border-slate-200/70 px-3 dark:border-slate-800 ${isRecentConversationsOpen ? 'justify-between' : 'justify-center'}`}>
          {isRecentConversationsOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-violet-600 dark:text-violet-300">Chats</p>
              <h2 className="truncate text-sm font-bold text-slate-950 dark:text-white">Manage Chat</h2>
            </div>
          )}
          <button
            type="button"
            onClick={() => dispatch(toggleRecentConversations())}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-violet-300"
            title={isRecentConversationsOpen ? 'Collapse chat manager' : 'Expand chat manager'}
          >
            {isRecentConversationsOpen ? <PanelLeftClose className="h-4 w-4" aria-hidden="true" /> : <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
          {isRecentConversationsOpen ? (
            <>
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                New Chat
              </button>

              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  const isEditing = conversation.id === editingConversationId;

                  return (
                    <div
                      key={conversation.id}
                      className={`group relative rounded-xl border p-2.5 transition-colors ${
                        isActive
                          ? 'border-violet-200 bg-violet-50/90 dark:border-violet-900/50 dark:bg-violet-950/25'
                          : 'border-slate-200 bg-white/70 hover:border-violet-200 hover:bg-white dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-violet-900'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={editingTopic}
                            onChange={(event) => setEditingTopic(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') handleSaveRename();
                              if (event.key === 'Escape') setEditingConversationId(null);
                            }}
                            className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-violet-900 dark:bg-slate-900 dark:text-slate-100"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveRename}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingConversationId(null)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSelectConversation(conversation.id)}
                            className="block w-full pr-8 text-left focus:outline-none"
                          >
                            <p className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">{conversation.topic}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <span className="truncate">{conversation.modelLabel}</span>
                              <span aria-hidden="true">•</span>
                              <span>{conversation.messages.length} msg</span>
                            </div>
                            <p className="mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              {formatConversationTime(conversation.updatedAt)}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOpenConversationMenuId(openConversationMenuId === conversation.id ? null : conversation.id)}
                            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-100 transition-colors hover:bg-white hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                            title="Conversation actions"
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          </button>

                          {openConversationMenuId === conversation.id && (
                            <div className="absolute right-2 top-10 z-20 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
                              <button
                                type="button"
                                onClick={() => handleStartRename(conversation.id, conversation.topic)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteConversation(conversation.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleClearChat}
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear History
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                title="New chat"
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <section className="mx-auto flex min-h-0 w-full max-w-[88rem] flex-1 flex-col">
        {error && (
          <div className="shrink-0 px-4 pt-3 sm:px-5 lg:px-6">
            <div
              role="alert"
               className="mx-auto flex max-w-6xl flex-col gap-3 rounded-xl border border-red-200 bg-red-50/95 p-3 text-red-800 shadow-[0_16px_45px_rgba(127,29,29,0.12)] backdrop-blur dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">Something went wrong</p>
                  <p className="mt-1 break-words text-[13px] leading-5 text-red-700/85 dark:text-red-200/85">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetryLastMessage}
                disabled={!lastUserMessage || isLoading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-red-950/70 dark:text-red-200 dark:hover:bg-red-900/40"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        )}

        <div
          ref={messagesScrollRef}
          onScroll={handleMessagesScroll}
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-5 lg:px-6"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {(isHistoryLoading || isOlderHistoryLoading) && (
              <div className="flex h-8 items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isOlderHistoryLoading ? 'Loading earlier messages' : 'Loading conversation'}
              </div>
            )}

            {historyError && !isHistoryLoading && !isOlderHistoryLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-red-600 dark:text-red-300">
                <span>{historyError}</span>
                <button
                  type="button"
                  className="font-bold underline underline-offset-2"
                  onClick={() => dispatch(fetchHistory({
                    mode: historyHasMore ? 'older' : 'initial',
                    conversationLocalId: activeConversationId ?? undefined,
                  }))}
                >
                  Retry
                </button>
              </div>
            )}

            {messages.length === 0 && !isLoading && !isHistoryLoading ? (
              <div className="grid min-h-full content-center gap-6 py-6">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/78 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700 shadow-sm backdrop-blur dark:border-violet-900/60 dark:bg-slate-950/78 dark:text-violet-300">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Ready
                  </div>
                  <h1 className="text-2xl font-bold leading-tight text-slate-950 dark:text-white sm:text-3xl">
                    Good to see you, {user?.full_name || 'there'}.
                  </h1>
                  <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Ask anything. I will keep the answer clear and useful.
                  </p>
                  {selectedAgent && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/82 px-3 py-1.5 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/82 dark:text-slate-200">
                      <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" aria-hidden="true" />
                      Working with {selectedAgent.name}
                    </div>
                  )}
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {starterPrompts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleUsePrompt(item.prompt)}
                        className="group rounded-xl border border-white/80 bg-white/82 p-3.5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_60px_rgba(88,28,135,0.14)] focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-950/82 dark:hover:border-violet-700"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-violet-100 group-hover:text-violet-700 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-violet-900/30 dark:group-hover:text-violet-300">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-violet-600 dark:group-hover:text-violet-300" aria-hidden="true" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h2>
                        <p className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">{item.prompt}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  msg.role === 'assistant' ? (
                    <AssistantResponse key={msg.id ?? `${msg.role}-${msg.timestamp ?? index}`} message={msg} onUsePrompt={handleUsePrompt} assistantLabel={assistantLabel} />
                  ) : (
                    <UserMessage key={msg.id ?? `${msg.role}-${msg.timestamp ?? index}`} message={msg} fallbackInitial={userInitial} />
                  )
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex w-full max-w-[44rem] items-start gap-2.5">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-teal-600 text-white shadow-lg shadow-violet-500/20">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="rounded-xl rounded-tl-md border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:120ms]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:240ms]"></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-white/70 bg-[#eef4ff]/92 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/92 sm:px-5 lg:px-6">
          <div className="mx-auto max-w-6xl">
            {inputValue.startsWith('/') && visibleCommands.length > 0 && (
              <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <Command className="h-4 w-4" aria-hidden="true" />
                  Command suggestions
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {visibleCommands.map((command) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.cmd}
                        onClick={() => {
                          setInputValue(command.cmd === '/rules' || command.cmd === '/clear' ? command.cmd : `${command.cmd} `);
                          inputRef.current?.focus();
                        }}
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-violet-50 dark:border-slate-800/70 dark:hover:bg-slate-900"
                        type="button"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-slate-900 dark:text-slate-100">{command.cmd}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">{command.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`rounded-xl border border-white/80 bg-white/90 p-2 shadow-[0_18px_54px_rgba(88,28,135,0.16)] backdrop-blur-xl transition-all duration-300 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/40 dark:border-slate-800 dark:bg-slate-950/90 ${isLoading ? 'pointer-events-none opacity-75' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 px-1.5 pb-2 dark:border-slate-800">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <div ref={agentPickerRef} className="relative min-w-[130px]">
                    <button
                      type="button"
                      onClick={() => setIsAgentPickerOpen((current) => !current)}
                      className={`flex h-9 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
                        isAgentPickerOpen
                          ? 'border-violet-300 bg-white shadow-[0_14px_30px_rgba(109,40,217,0.14)] dark:border-violet-500/60 dark:bg-slate-950'
                          : 'border-slate-200 bg-slate-50 hover:border-violet-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                      }`}
                      aria-haspopup="listbox"
                      aria-expanded={isAgentPickerOpen}
                      aria-label="Select AI agent"
                      disabled={agents.length === 0}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm dark:bg-slate-950 dark:text-violet-300">
                        <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="mt-0.5 block truncate text-[13px] font-bold leading-4 text-slate-800 dark:text-slate-100">
                          {selectedAgent?.name ?? 'Default agent'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isAgentPickerOpen ? 'rotate-180 text-violet-600 dark:text-violet-300' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {isAgentPickerOpen && agents.length > 0 && (
                      <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-30 w-[18rem] max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
                        <div className="border-b border-slate-200/80 px-3 py-2.5 dark:border-slate-800">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-300">
                            Assistant models
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Pick the profile for this chat.
                          </p>
                        </div>
                        <div className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="AI agent options">
                          {agents.map((agent) => {
                            const isSelected = agent.agent_id === selectedAgentId;

                            return (
                              <button
                                key={agent.agent_id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedAgentId(agent.agent_id);
                                  setIsAgentPickerOpen(false);
                                }}
                                className={`mb-1 flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all last:mb-0 ${
                                  isSelected
                                    ? 'border-violet-200 bg-violet-50 shadow-sm dark:border-violet-500/40 dark:bg-violet-950/20'
                                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900/80'
                                }`}
                              >
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                  isSelected
                                    ? 'bg-violet-600 text-white dark:bg-violet-500'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                }`}>
                                  {isSelected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Bot className="h-3.5 w-3.5" aria-hidden="true" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">
                                      {agent.name}
                                    </span>
                                    {agent.is_active && (
                                      <span className="inline-flex shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                        Active
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
                                    {agent.model_profile.provider} / {agent.model_profile.model_name}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className=" h-9 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/70" role="group" aria-label="Chat classification mode">
                    {chatModeOptions.map((mode) => {
                      const Icon = mode.icon;
                      const isActive = chatMode === mode.value;

                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setChatMode(mode.value)}
                          className={`inline-flex h-7 min-w-[4.5rem] items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            isActive
                              ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/20 dark:bg-violet-500 dark:text-white dark:shadow-violet-950/30'
                              : 'text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-950/70 dark:hover:text-slate-100'
                          }`}
                          title={`${mode.label} ${mode.description}`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  {isLoggingEnabled && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></span>
                      Logs active
                    </span>
                  )}
                  <span className="hidden items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 sm:inline-flex">
                    <SelectedChatModeIcon className="h-3 w-3" aria-hidden="true" />
                    {selectedChatMode.description}
                  </span>
                </div>
                <button
                  onClick={handleClearChat}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                  type="button"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  Clear
                </button>
              </div>

              {attachment && (
                <ChatAttachmentChip attachment={attachment} onRemove={clearAttachment} />
              )}

              <div className="flex items-center gap-1 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={CHAT_ATTACHMENT_ACCEPT}
                  onChange={(event) => void handleFileSelection(event)}
                  className="hidden"
                />
                <button
                  onClick={openFilePicker}
                  disabled={Boolean(attachment)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-violet-300"
                  title={attachment ? 'Remove the current attachment first' : `Attach and sync a file (${CHAT_ATTACHMENT_MAX_SIZE_LABEL} max)`}
                  type="button"
                >
                  <Paperclip className="h-4.5 w-4.5" aria-hidden="true" />
                </button>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="max-h-24 min-h-10 flex-1 resize-none overflow-y-auto border-none bg-transparent px-1 py-1 text-sm leading-5 text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder={isAttachmentBusy ? 'Preparing your file...' : isLoading ? 'AI is composing a structured answer...' : 'Ask for analysis, summary, or next actions...'}
                  rows={2}
                />
                <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-violet-300" title="Voice input" type="button">
                  <Mic className="h-4.5 w-4.5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || isAttachmentBusy}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:focus:ring-offset-slate-950"
                  type="button"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
