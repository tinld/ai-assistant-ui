import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setActiveConversation } from '../store/chatSlice';
import { toggleRecentConversations } from '../store/appSlice';

export const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversationId } = useSelector((state: RootState) => state.chat);
  const isRecentConversationsOpen = useSelector((state: RootState) => state.app.isRecentConversationsOpen);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversationId]);

  return (
    <div className="flex-1 flex h-full">
      {/* Left Panel: Recent Conversations */}
      <section className={`border-r border-outline-variant dark:border-slate-800 bg-surface-container-lowest dark:bg-slate-950 flex flex-col flex-shrink-0 z-10 h-full transition-all duration-300 ${isRecentConversationsOpen ? 'w-80' : 'w-16'}`}>
        <div className={`p-md border-b border-outline-variant dark:border-slate-800 flex items-center bg-surface-container-lowest dark:bg-slate-950 sticky top-0 h-[65px] ${isRecentConversationsOpen ? 'justify-between' : 'justify-center'}`}>
          {isRecentConversationsOpen && <h3 className="font-h2 text-h2 text-on-surface dark:text-slate-200">Gần đây</h3>}
          <div className="flex items-center gap-2">
            {isRecentConversationsOpen && (
              <button className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 transition-colors">
                <span className="material-symbols-outlined">search</span>
              </button>
            )}
            <button 
              className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 transition-colors bg-surface-container-low dark:bg-slate-900 p-1.5 rounded-lg"
              onClick={() => dispatch(toggleRecentConversations())}
              title={isRecentConversationsOpen ? "Collapse Recent" : "Expand Recent"}
            >
              <span className="material-symbols-outlined">
                {isRecentConversationsOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-sm">
          {conversations.map(conv => (
            <button 
              key={conv.id}
              onClick={() => dispatch(setActiveConversation(conv.id))}
              className={`w-full text-left p-md border-l-4 transition-colors flex flex-col gap-xs group ${
                activeConversationId === conv.id 
                  ? 'bg-surface-container-low dark:bg-slate-900 border-primary dark:border-violet-500' 
                  : 'hover:bg-surface-container-low dark:hover:bg-slate-900 border-transparent'
              } ${!isRecentConversationsOpen ? 'items-center px-0' : ''}`}
              title={!isRecentConversationsOpen ? conv.title : undefined}
            >
              {isRecentConversationsOpen ? (
                <>
                  <div className="flex justify-between items-start w-full">
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-slate-200 font-medium truncate pr-4">{conv.title}</span>
                    <span className="font-caption text-caption text-on-surface-variant dark:text-slate-400 whitespace-nowrap">{conv.updatedAt}</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 line-clamp-1 group-hover:text-on-surface dark:group-hover:text-slate-200 transition-colors">
                    {conv.snippet}
                  </span>
                </>
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-slate-800 flex items-center justify-center text-on-surface-variant dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Center Panel: Chat Window */}
      <section className="flex-1 flex flex-col relative bg-surface-bright dark:bg-slate-900 h-full">
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto px-container-padding pt-xl pb-32 flex flex-col gap-lg scroll-smooth">
          {activeConversation?.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-100px]">
              <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 shadow-sm">
                <span className="material-symbols-outlined text-4xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
              </div>
              <h2 className="text-3xl font-bold text-on-surface dark:text-slate-200 mb-2">Tôi có thể giúp gì cho bạn?</h2>
              <p className="text-on-surface-variant dark:text-slate-400 max-w-md">
                Bạn có thể hỏi tôi về bất kỳ tài liệu nào trong hệ thống, yêu cầu phân tích dữ liệu, hoặc bắt đầu một cuộc trò chuyện mới.
              </p>
            </div>
          ) : (
            <>
              {/* Topic Timestamp */}
              <div className="flex justify-center my-md">
                <span className="px-3 py-1 bg-surface-container dark:bg-slate-800 rounded-full font-caption text-caption text-on-surface-variant dark:text-slate-400">Hôm nay, 14:30</span>
              </div>

              {activeConversation?.messages.map((msg, index) => (
                <div key={msg.id} className={`flex items-start gap-md max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''} ${index > 0 ? 'mt-xs' : ''}`}>
                  {msg.role === 'assistant' ? (
                    <div className="w-8 h-8 rounded-full bg-secondary-container dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 text-on-secondary-container dark:text-violet-300 mt-1">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                  ) : (
                    <img alt="User Profile" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQoh_icYJstQohux4f4WljuYwh7Fude6o2vmBzC2-0-hAA5H7vYnhQg1LQdaKCIPpRqmZf6VvLMe-UN4BT4n1TCbChUey7i9pAPiCt9w7jw2IOjlgeBPP__831xL4Ztt1vydmJcna_PTkQam1OX8I5D4a3zmMrlV5J6XYZYBRFAGrewlhuQy-7kRUQ_qninjVEcxnDy2-6Dw7SG3UIuNgRNomcZ6A07K5n30QBMxr8nB57IceB_gJJy5AVs3k_4gagBoH1HUgSLE8"/>
                  )}
                  
                  <div className={`${msg.role === 'assistant' ? 'glass-effect rounded-2xl rounded-tl-none text-on-surface dark:text-slate-200' : 'bg-primary dark:bg-violet-600 text-on-primary rounded-2xl rounded-tr-none'} p-md font-body-lg text-body-lg shadow-sm flex flex-col gap-stack-gap`}>
                    {msg.files && msg.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-sm bg-white/20 dark:bg-black/20 px-3 py-2 rounded-lg w-max backdrop-blur-sm border border-white/10 dark:border-white/5">
                        <span className="material-symbols-outlined text-on-primary">description</span>
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md text-on-primary font-medium">{file.name}</span>
                          <span className="font-caption text-caption text-on-primary/80">{file.size}</span>
                        </div>
                      </div>
                    ))}
                    
                    {msg.role === 'assistant' && msg.content.includes('<div') ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      <p>{msg.content}</p>
                    )}

                    {msg.role === 'assistant' && msg.references && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-outline-variant/30">
                        <button className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim transition-colors font-body-md text-body-md font-medium">Chi tiết chi phí vận hành</button>
                        <button className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim transition-colors font-body-md text-body-md font-medium">Tạo slide trình bày</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-container-padding bg-gradient-to-t from-surface-bright dark:from-slate-900 via-surface-bright dark:via-slate-900 to-transparent pb-8">
          <div className="max-w-4xl mx-auto relative group">
            <div className="bg-surface-container-lowest dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-2xl p-2 flex flex-col ambient-shadow transition-all duration-300 focus-within:border-primary dark:focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-primary dark:focus-within:ring-violet-500">
              <div className="flex items-end gap-2">
                <button className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 mb-1" title="Đính kèm tệp">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <textarea 
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-lg text-body-lg text-on-surface dark:text-slate-200 placeholder:text-on-surface-variant/60 dark:placeholder:text-slate-500 py-3 min-h-[48px] max-h-32 overflow-y-auto" 
                  placeholder="Nhập tin nhắn của bạn..." 
                  rows={1}
                />
                <button className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-violet-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 mb-1" title="Nhập bằng giọng nói">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-primary dark:bg-violet-600 text-on-primary flex items-center justify-center flex-shrink-0 hover:bg-primary-container dark:hover:bg-violet-500 transition-colors mb-1 shadow-md">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              <div className="flex items-center gap-4 px-2 pt-2 border-t border-outline-variant/30 dark:border-slate-800 opacity-60 hover:opacity-100 transition-opacity">
                <span className="font-caption text-caption text-on-surface-variant dark:text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  AI có thể mắc lỗi. Hãy kiểm tra lại các thông tin quan trọng.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
