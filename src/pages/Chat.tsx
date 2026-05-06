import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchHistory, sendMessage, clearChat, addLocalMessage } from '../store/chatSlice';
import { toggleRecentConversations } from '../store/appSlice';

export const Chat: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, isLoading } = useSelector((state: RootState) => state.chat);
  const isRecentConversationsOpen = useSelector((state: RootState) => state.app.isRecentConversationsOpen);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [inputValue, setInputValue] = useState('');
  const [chatMode, setChatMode] = useState('auto');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch real history from backend on mount
    dispatch(fetchHistory());
  }, [dispatch]);

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const messageContent = inputValue.trim();
    setInputValue(''); // Clear input

    // Optimistically add user message to UI
    dispatch(addLocalMessage({
      role: 'user',
      content: messageContent,
    }));

    // Send to backend
    dispatch(sendMessage(messageContent));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      dispatch(clearChat());
    }
  };

  return (
    <div className="flex-1 flex h-full">
      {/* Left Panel: Recent Conversations -> Repurposed to Session Control */}
      <section className={`border-r border-outline-variant dark:border-slate-800 bg-surface-container-lowest dark:bg-slate-950 flex flex-col flex-shrink-0 z-10 h-full transition-all duration-300 ${isRecentConversationsOpen ? 'w-80' : 'w-16'}`}>
        <div className={`p-md border-b border-outline-variant dark:border-slate-800 flex items-center bg-surface-container-lowest dark:bg-slate-950 sticky top-0 h-[65px] ${isRecentConversationsOpen ? 'justify-between' : 'justify-center'}`}>
          {isRecentConversationsOpen && <h3 className="font-h2 text-h2 text-on-surface dark:text-slate-200">Phiên hiện tại</h3>}
          <div className="flex items-center gap-2">
            <button 
              className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 transition-colors bg-surface-container-low dark:bg-slate-900 p-1.5 rounded-lg"
              onClick={() => dispatch(toggleRecentConversations())}
              title={isRecentConversationsOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <span className="material-symbols-outlined">
                {isRecentConversationsOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-sm flex flex-col gap-2 px-2">
          {isRecentConversationsOpen ? (
            <>
              <div className="w-full text-left p-md border-l-4 border-primary dark:border-violet-500 bg-surface-container-low dark:bg-slate-900 transition-colors flex flex-col gap-xs group">
                <div className="flex justify-between items-start w-full">
                  <span className="font-body-lg text-body-lg text-on-surface dark:text-slate-200 font-medium truncate pr-4">Trò chuyện AI</span>
                </div>
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 line-clamp-1">
                  Đang hoạt động...
                </span>
              </div>

              <div className="mt-auto mb-4">
                <button 
                  onClick={handleClearChat}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Xóa lịch sử</span>
                </button>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center gap-4 mt-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center" title="Trò chuyện AI">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </div>
                <button onClick={handleClearChat} className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors" title="Xóa lịch sử">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
             </div>
          )}
        </div>
      </section>

      {/* Center Panel: Chat Window */}
      <section className="flex-1 flex flex-col relative bg-surface-bright dark:bg-slate-900 h-full">
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto px-container-padding pt-xl pb-32 flex flex-col gap-lg scroll-smooth">
          {messages.length === 0 && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-100px]">
              <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 shadow-sm">
                <span className="material-symbols-outlined text-4xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
              </div>
              <h2 className="text-3xl font-bold text-on-surface dark:text-slate-200 mb-2">Xin chào, {user?.full_name || 'bạn'}!</h2>
              <p className="text-on-surface-variant dark:text-slate-400 max-w-md">
                Hệ thống AI đã sẵn sàng. Hãy bắt đầu trò chuyện bằng cách nhập tin nhắn bên dưới.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-md max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''} ${index > 0 ? 'mt-xs' : ''}`}>
                  {msg.role === 'assistant' ? (
                    <div className="w-8 h-8 rounded-full bg-secondary-container dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 text-on-secondary-container dark:text-violet-300 mt-1">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white mt-1 uppercase shadow-sm">
                      {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </div>
                  )}
                  
                  <div className={`${msg.role === 'assistant' ? 'glass-effect rounded-2xl rounded-tl-none text-on-surface dark:text-slate-200' : 'bg-primary dark:bg-violet-600 text-on-primary rounded-2xl rounded-tr-none'} p-md font-body-lg text-body-lg shadow-sm flex flex-col gap-stack-gap`}>
                    {msg.role === 'assistant' && msg.content.includes('<div') ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-md max-w-[85%] mt-xs">
                  <div className="w-8 h-8 rounded-full bg-secondary-container dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 text-on-secondary-container dark:text-violet-300 mt-1">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                  </div>
                  <div className="glass-effect rounded-2xl rounded-tl-none text-on-surface dark:text-slate-200 p-md shadow-sm flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"></span>
                     <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                     <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-container-padding bg-gradient-to-t from-surface-bright dark:from-slate-900 via-surface-bright dark:via-slate-900 to-transparent pb-8">
          <div className="max-w-4xl mx-auto relative group">
            {/* Command Suggestions Popup */}
            {inputValue.startsWith('/') && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-2xl shadow-lg flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
                <div className="px-4 py-2 bg-surface-container-low dark:bg-slate-950 border-b border-outline-variant/50 dark:border-slate-800">
                  <span className="text-xs font-medium text-on-surface-variant dark:text-slate-400">Gợi ý lệnh</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {[
                    { cmd: '/facts', icon: 'psychology', desc: 'Nạp kiến thức mới cho AI' },
                    { cmd: '/settings', icon: 'tune', desc: 'Tùy chỉnh tính cách của AI' },
                    { cmd: '/prompt', icon: 'rule', desc: 'Thêm quy tắc hành xử' },
                    { cmd: '/rules', icon: 'list', desc: 'Xem danh sách quy tắc' },
                    { cmd: '/clear', icon: 'mop', desc: 'Xóa ngữ cảnh hội thoại hiện tại' },
                  ].filter(c => c.cmd.startsWith(inputValue.split(' ')[0])).map((c) => (
                    <button 
                      key={c.cmd}
                      onClick={() => { setInputValue(c.cmd === '/rules' || c.cmd === '/clear' ? c.cmd : c.cmd + ' '); inputRef.current?.focus(); }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container dark:hover:bg-slate-800 transition-colors text-left border-b last:border-0 border-outline-variant/10 dark:border-slate-800/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-violet-900/30 flex items-center justify-center text-primary dark:text-violet-400">
                        <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-on-surface dark:text-slate-200">{c.cmd}</span>
                        <span className="text-xs text-on-surface-variant dark:text-slate-400">{c.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={`bg-surface-container-lowest dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-2xl p-2 flex flex-col ambient-shadow transition-all duration-300 focus-within:border-primary dark:focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-primary dark:focus-within:ring-violet-500 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
              
              {/* Context / Model Selector */}
              <div className="flex items-center justify-between border-b border-outline-variant/30 dark:border-slate-800/50 pb-2 mb-1 px-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">tune</span>
                  <select 
                    value={chatMode}
                    onChange={(e) => setChatMode(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:text-violet-600 transition-colors"
                  >
                    <option value="auto">✨ Auto-Classify (Magic)</option>
                    <option value="general">🌍 General Web Search</option>
                    <option value="private">🔒 Private Knowledge Base</option>
                  </select>
                </div>
                {chatMode === 'private' && (
                  <span className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">RAG Active</span>
                )}
              </div>

              <div className="flex items-end gap-2 mt-1">
                <button className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 mb-1" title="Đính kèm tệp">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <textarea 
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-lg text-body-lg text-on-surface dark:text-slate-200 placeholder:text-on-surface-variant/60 dark:placeholder:text-slate-500 py-3 min-h-[48px] max-h-32 overflow-y-auto" 
                  placeholder={isLoading ? "AI đang trả lời..." : "Nhập tin nhắn của bạn..."} 
                  rows={1}
                />
                <button className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 mb-1" title="Nhập bằng giọng nói">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-primary dark:bg-violet-600 text-on-primary flex items-center justify-center flex-shrink-0 hover:bg-primary-container dark:hover:bg-violet-500 transition-colors mb-1 shadow-md disabled:opacity-50 disabled:hover:bg-primary"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
