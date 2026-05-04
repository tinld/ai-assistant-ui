import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setActiveConversation } from '../store/chatSlice';

export const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversationId } = useSelector((state: RootState) => state.chat);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex-1 flex h-full">
      {/* Left Panel: Recent Conversations */}
      <section className="w-80 border-r border-outline-variant bg-surface-container-lowest flex flex-col flex-shrink-0 z-10 h-full">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0">
          <h3 className="font-h2 text-h2 text-on-surface">Gần đây</h3>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-sm">
          {conversations.map(conv => (
            <button 
              key={conv.id}
              onClick={() => dispatch(setActiveConversation(conv.id))}
              className={`w-full text-left p-md border-l-4 transition-colors flex flex-col gap-xs group ${
                activeConversationId === conv.id 
                  ? 'bg-surface-container-low border-primary' 
                  : 'hover:bg-surface-container-low border-transparent'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="font-body-lg text-body-lg text-on-surface font-medium truncate pr-4">{conv.title}</span>
                <span className="font-caption text-caption text-on-surface-variant whitespace-nowrap">{conv.updatedAt}</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface-variant line-clamp-1 group-hover:text-on-surface transition-colors">
                {conv.snippet}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Center Panel: Chat Window */}
      <section className="flex-1 flex flex-col relative bg-surface-bright h-full">
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto px-container-padding pt-xl pb-32 flex flex-col gap-lg scroll-smooth">
          {/* Topic Timestamp */}
          <div className="flex justify-center my-md">
            <span className="px-3 py-1 bg-surface-container rounded-full font-caption text-caption text-on-surface-variant">Hôm nay, 14:30</span>
          </div>

          {activeConversation?.messages.map((msg, index) => (
            <div key={msg.id} className={`flex items-start gap-md max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''} ${index > 0 ? 'mt-xs' : ''}`}>
              {msg.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 text-on-secondary-container mt-1">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                </div>
              ) : (
                <img alt="User Profile" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQoh_icYJstQohux4f4WljuYwh7Fude6o2vmBzC2-0-hAA5H7vYnhQg1LQdaKCIPpRqmZf6VvLMe-UN4BT4n1TCbChUey7i9pAPiCt9w7jw2IOjlgeBPP__831xL4Ztt1vydmJcna_PTkQam1OX8I5D4a3zmMrlV5J6XYZYBRFAGrewlhuQy-7kRUQ_qninjVEcxnDy2-6Dw7SG3UIuNgRNomcZ6A07K5n30QBMxr8nB57IceB_gJJy5AVs3k_4gagBoH1HUgSLE8"/>
              )}
              
              <div className={`${msg.role === 'assistant' ? 'glass-effect rounded-2xl rounded-tl-none text-on-surface' : 'bg-primary text-on-primary rounded-2xl rounded-tr-none'} p-md font-body-lg text-body-lg shadow-sm flex flex-col gap-stack-gap`}>
                {msg.files && msg.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-sm bg-white/20 px-3 py-2 rounded-lg w-max backdrop-blur-sm border border-white/10">
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
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-container-padding bg-gradient-to-t from-surface-bright via-surface-bright to-transparent pb-8">
          <div className="max-w-4xl mx-auto relative group">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-2 flex flex-col ambient-shadow transition-all duration-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <div className="flex items-end gap-2">
                <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors flex-shrink-0 mb-1" title="Đính kèm tệp">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <textarea 
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/60 py-3 min-h-[48px] max-h-32 overflow-y-auto" 
                  placeholder="Nhập tin nhắn của bạn..." 
                  rows={1}
                />
                <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors flex-shrink-0 mb-1" title="Nhập bằng giọng nói">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 hover:bg-primary-container transition-colors mb-1 shadow-md">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              <div className="flex items-center gap-4 px-2 pt-2 border-t border-outline-variant/30 opacity-60 hover:opacity-100 transition-opacity">
                <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
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
