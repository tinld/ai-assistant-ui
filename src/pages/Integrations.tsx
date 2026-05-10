import React, { useState } from 'react';

import type { Integration } from '../types/integration.types';

const INITIAL_MOCK_DATA: Integration[] = [
  {
    id: '1',
    name: 'Google Drive',
    description: 'Sync documents, spreadsheets, and presentations automatically.',
    category: 'Storage',
    icon: 'add_to_drive',
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconTextClass: 'text-blue-600 dark:text-blue-400',
    isConnected: true,
  },
  {
    id: '2',
    name: 'Slack',
    description: 'Send notifications and receive commands via Slack channels.',
    category: 'Communication',
    icon: 'forum',
    iconBgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconTextClass: 'text-purple-600 dark:text-purple-400',
    isConnected: true,
  },
  {
    id: '3',
    name: 'Salesforce',
    description: 'Connect customer data, leads, and sales opportunities.',
    category: 'CRM',
    icon: 'cloud',
    iconBgClass: 'bg-sky-100 dark:bg-sky-900/30',
    iconTextClass: 'text-sky-600 dark:text-sky-400',
    isConnected: false,
  },
  {
    id: '4',
    name: 'PostgreSQL',
    description: 'Directly query and analyze your database records.',
    category: 'Database',
    icon: 'database',
    iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconTextClass: 'text-indigo-600 dark:text-indigo-400',
    isConnected: false,
  },
  {
    id: '5',
    name: 'Jira',
    description: 'Create, update, and manage project tickets and issues.',
    category: 'Communication',
    icon: 'developer_board',
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconTextClass: 'text-blue-600 dark:text-blue-400',
    isConnected: false,
  },
  {
    id: '6',
    name: 'Custom Webhook',
    description: 'Trigger external workflows with custom HTTP payloads.',
    category: 'API',
    icon: 'webhook',
    iconBgClass: 'bg-slate-100 dark:bg-slate-800',
    iconTextClass: 'text-slate-600 dark:text-slate-400',
    isConnected: true,
  },
];

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_MOCK_DATA);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === id ? { ...int, isConnected: !int.isConnected } : int
      )
    );
  };

  const filteredIntegrations = integrations.filter(int => {
    if (filter !== 'All' && int.category !== filter) return false;
    if (search && !int.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-slate-200">Integrations</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-1">Connect external services, databases, and APIs to expand capabilities.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary dark:bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Custom API
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-outline-variant dark:border-slate-800 pb-4">
          <div className="flex flex-wrap gap-2">
            {['All', 'Storage', 'Communication', 'CRM', 'Database', 'API'].map(tab => (
              <button 
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === tab 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search integrations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <div key={integration.id} className={`bg-white dark:bg-slate-950 border rounded-xl p-5 hover:shadow-md transition-all flex flex-col ${
              integration.isConnected ? 'border-violet-300 dark:border-violet-800' : 'border-outline-variant dark:border-slate-800'
            }`}>
              
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${integration.iconBgClass} ${integration.iconTextClass}`}>
                  <span className="material-symbols-outlined text-3xl">{integration.icon}</span>
                </div>
                
                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={integration.isConnected} 
                    onChange={() => toggleIntegration(integration.id)} 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
                </label>
              </div>
              
              <h3 className="text-lg font-bold text-on-surface dark:text-slate-200 mb-1">{integration.name}</h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-4 flex-1">{integration.description}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                  integration.isConnected 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {integration.isConnected ? 'Connected' : 'Not Connected'}
                </span>
                
                {integration.isConnected && (
                  <button className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1" title="Configure">
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {filteredIntegrations.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <span className="material-symbols-outlined text-3xl">extension_off</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface dark:text-slate-200">No integrations found</h3>
              <p className="text-on-surface-variant dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
