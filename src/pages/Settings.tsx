import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import type { RootState } from '../store';
type Tab = 'Profile' | 'Appearance' | 'Integrations' | 'Billing';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Integrations');
  const [isTabsCollapsed, setIsTabsCollapsed] = useState(false);

  const token = useSelector((state: RootState) => state.auth.token);
  const [useRagReranking, setUseRagReranking] = useState(true);
  const [enablePromptLogging, setEnablePromptLogging] = useState(false);
  const [telegramLogChatId, setTelegramLogChatId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!token) return;
        const res = await api.get<{ data: { settings: { use_rag_reranking: boolean, enable_prompt_logging?: boolean, telegram_log_chat_id?: string } } }>('/api/settings', token);
        if (res?.data?.settings) {
          if (typeof res.data.settings.use_rag_reranking === 'boolean') {
            setUseRagReranking(res.data.settings.use_rag_reranking);
          }
          if (typeof res.data.settings.enable_prompt_logging === 'boolean') {
            setEnablePromptLogging(res.data.settings.enable_prompt_logging);
          }
          if (typeof res.data.settings.telegram_log_chat_id === 'string') {
            setTelegramLogChatId(res.data.settings.telegram_log_chat_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await api.put('/api/settings', { 
        use_rag_reranking: useRagReranking,
        enable_prompt_logging: enablePromptLogging,
        telegram_log_chat_id: telegramLogChatId
      }, token);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error("Failed to save settings", err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Tab navigation items
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'Profile', icon: 'person', label: 'My Profile' },
    { id: 'Appearance', icon: 'palette', label: 'Appearance' },
    { id: 'Integrations', icon: 'extension', label: 'Integrations' },
    { id: 'Billing', icon: 'credit_card', label: 'Billing' },
  ];

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-8 h-full">
        
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-on-surface dark:text-slate-200">Settings</h1>
          <p className="text-on-surface-variant dark:text-slate-400 mt-1">Manage your account preferences and integration configurations.</p>
        </div>

        {/* Settings Layout */}
        <div className="flex flex-col md:flex-row gap-8 flex-1 items-start">
          
          {/* Sidebar Tabs */}
          <div className={`flex-shrink-0 bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col ${isTabsCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'}`}>
            <div className={`flex items-center p-2 border-b border-outline-variant dark:border-slate-800/50 ${isTabsCollapsed ? 'justify-center' : 'justify-end'}`}>
              <button 
                onClick={() => setIsTabsCollapsed(!isTabsCollapsed)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                title={isTabsCollapsed ? "Expand Menu" : "Collapse Menu"}
              >
                <span className="material-symbols-outlined text-[20px]">{isTabsCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}</span>
              </button>
            </div>
            <nav className="flex flex-col p-2 gap-1 flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={isTabsCollapsed ? tab.label : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  } ${isTabsCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  {!isTabsCollapsed && <span>{tab.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-8 shadow-sm">
            
            {activeTab === 'Integrations' && (
              <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-on-surface dark:text-slate-200">Integration Settings</h2>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">Configure API keys, webhooks, and authentication for your connected services.</p>
                </div>

                <div className="border-t border-outline-variant dark:border-slate-800 pt-6">
                  {/* Slack Configuration */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="material-symbols-outlined text-[18px]">forum</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Slack Configuration</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bot User OAuth Token</label>
                        <input 
                          type="password" 
                          defaultValue="xoxb-1234567890-1234567890-abcdefg"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default Channel ID</label>
                        <input 
                          type="text" 
                          defaultValue="C01234567"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="px-4 py-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-sm font-semibold rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">
                        Test Connection
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant dark:border-slate-800/50 my-6"></div>

                  {/* Custom Webhook Configuration */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">webhook</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Custom Webhook</h3>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Endpoint URL</label>
                        <input 
                          type="url" 
                          placeholder="https://your-api.com/webhooks/receive"
                          defaultValue="https://api.internal.company.com/v1/ai-events"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Webhook Secret (for signature verification)</label>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            defaultValue="whsec_8a7b6c5d4e3f2g1h"
                            disabled
                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-outline-variant dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-500 cursor-not-allowed"
                          />
                          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-outline-variant dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                            Roll Secret
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use this secret to verify the HMAC-SHA256 signature in the `X-Webhook-Signature` header.</p>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Events to Subscribe</label>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          {['Conversation Started', 'Message Received', 'Document Indexed', 'Error Occurred'].map(event => (
                            <label key={event} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:checked:bg-violet-600" />
                              <span className="text-sm text-slate-600 dark:text-slate-400">{event}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="border-t border-outline-variant dark:border-slate-800/50 my-6"></div>

                  {/* Telegram Prompt Logger */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Telegram Prompt Logger</h3>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Prompt Logging</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Forwards exactly what is sent to the LLM (System Prompt + History + User input) to Telegram for debugging.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={enablePromptLogging}
                            onChange={(e) => setEnablePromptLogging(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
                        </label>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Telegram Chat ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 123456789"
                          value={telegramLogChatId}
                          onChange={(e) => setTelegramLogChatId(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant dark:border-slate-800/50 my-6"></div>

                  {/* AI Configuration */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-[18px]">psychiatry</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">AI Configuration</h3>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable RAG Reranking</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Improves knowledge base retrieval quality using LLM-based reranking, which may slightly increase response time and cost.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={useRagReranking}
                            onChange={(e) => setUseRagReranking(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant dark:border-slate-800 flex justify-end gap-4">
                  <button className="px-5 py-2.5 bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all shadow-sm disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Configurations'}
                  </button>
                </div>
              </div>
            )}

            {activeTab !== 'Integrations' && (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">construction</span>
                <h3 className="text-xl font-bold text-on-surface dark:text-slate-200">Coming Soon</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-sm">The {activeTab} settings panel is currently under construction. Please check back later.</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
