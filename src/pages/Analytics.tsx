import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CHART_DATA = [
  { name: 'Mon', conversations: 120, tokens: 14000 },
  { name: 'Tue', conversations: 180, tokens: 22000 },
  { name: 'Wed', conversations: 250, tokens: 35000 },
  { name: 'Thu', conversations: 210, tokens: 28000 },
  { name: 'Fri', conversations: 190, tokens: 24000 },
  { name: 'Sat', conversations: 90, tokens: 11000 },
  { name: 'Sun', conversations: 60, tokens: 8000 },
];

const CATEGORY_DATA = [
  { name: 'General QA', value: 45000 },
  { name: 'Coding Assistance', value: 38000 },
  { name: 'Data Analysis', value: 25000 },
  { name: 'Document Summarization', value: 18000 },
  { name: 'Creative Writing', value: 12000 },
];

const RECENT_ACTIVITY = [
  { id: '1', query: 'Write a React component with Tailwind...', type: 'Coding', tokens: 840, time: '10:45 AM', status: 'Success' },
  { id: '2', query: 'Summarize the Q3 Financial Report...', type: 'Doc Summary', tokens: 4250, time: '10:12 AM', status: 'Success' },
  { id: '3', query: 'What is the weather in Tokyo?', type: 'General', tokens: 125, time: '09:30 AM', status: 'Success' },
  { id: '4', query: 'Query PostgreSQL for user signups...', type: 'Data Analysis', tokens: 0, time: '09:15 AM', status: 'Failed' },
  { id: '5', query: 'Generate an email template for...', type: 'Creative', tokens: 320, time: '08:50 AM', status: 'Success' },
];

export const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const theme = useSelector((state: RootState) => state.app.theme);
  
  // Custom colors based on theme
  const chartColors = {
    primary: '#7c3aed', // violet-600
    secondary: '#38bdf8', // sky-400
    grid: theme === 'dark' ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    text: theme === 'dark' ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    bg: theme === 'dark' ? '#0f172a' : '#ffffff', // slate-950 / white
    border: theme === 'dark' ? '#1e293b' : '#f1f5f9', // slate-800 / slate-100
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: <span className="font-medium">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter'] pb-12">
      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-slate-200">Analytics Dashboard</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-1">Monitor AI assistant usage, token consumption, and performance.</p>
          </div>
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 text-on-surface dark:text-slate-200 px-4 py-2.5 pr-10 rounded-lg font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm cursor-pointer"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Conversations', value: '1,100', trend: '+12%', trendUp: true, icon: 'forum', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30' },
            { label: 'Tokens Processed', value: '142.5K', trend: '+24%', trendUp: true, icon: 'generating_tokens', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Avg Response Time', value: '840 ms', trend: '-5%', trendUp: true, icon: 'speed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: 'User Satisfaction', value: '94%', trend: '-1%', trendUp: false, icon: 'thumb_up', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                  <span className="material-symbols-outlined">{kpi.icon}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} flex items-center gap-0.5`}>
                  <span className="material-symbols-outlined text-[12px]">{kpi.trendUp ? 'trending_up' : 'trending_down'}</span>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-on-surface dark:text-slate-200">{kpi.value}</h3>
            </div>
          ))}
        </div>

        {/* Main Chart */}
        <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface dark:text-slate-200 mb-6">Usage Over Time</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="name" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} tickLine={false} axisLine={false} dx={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="conversations" name="Conversations" stroke={chartColors.primary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="tokens" name="Tokens Processed" stroke={chartColors.secondary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lower Section: Bar Chart & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-on-surface dark:text-slate-200 mb-6">Token Usage by Category</h3>
            <div className="h-[300px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} width={120} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: chartColors.border }} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Tokens" fill={chartColors.primary} radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Recent Activity</h3>
              <button className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant dark:border-slate-800 text-sm text-on-surface-variant dark:text-slate-400">
                    <th className="pb-3 font-medium px-4">Query / Task</th>
                    <th className="pb-3 font-medium px-4">Type</th>
                    <th className="pb-3 font-medium px-4 text-right">Tokens</th>
                    <th className="pb-3 font-medium px-4">Time</th>
                    <th className="pb-3 font-medium px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ACTIVITY.map((activity, index) => (
                    <tr key={activity.id} className={`text-sm ${index !== RECENT_ACTIVITY.length - 1 ? 'border-b border-outline-variant dark:border-slate-800/50' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                      <td className="py-3 px-4 text-on-surface dark:text-slate-200 font-medium truncate max-w-[200px]" title={activity.query}>{activity.query}</td>
                      <td className="py-3 px-4 text-on-surface-variant dark:text-slate-400 whitespace-nowrap">{activity.type}</td>
                      <td className="py-3 px-4 text-on-surface-variant dark:text-slate-400 text-right font-mono">{activity.tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-on-surface-variant dark:text-slate-400 whitespace-nowrap">{activity.time}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                          activity.status === 'Success' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};
