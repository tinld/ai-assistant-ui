import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ANALYTICS_RANGE_OPTIONS, ANALYTICS_REFRESH_INTERVAL_MS, type AnalyticsRange } from '../constants/analytics.constants';
import { analyticsApi } from '../services/analyticsApi';
import type { RootState } from '../store';
import type { AnalyticsReport } from '../types/analytics.types';

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

interface MetricCard {
  label: string;
  value: string;
  note: string;
  icon: string;
  color: string;
  bg: string;
}

const formatCompactNumber = (value: number): string =>
  Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const formatNumber = (value: number): string => Intl.NumberFormat('en').format(value);

const formatActivityTime = (value?: string | null): string => {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const truncateText = (value: string, maxLength = 90): string =>
  value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;

const getRoleLabel = (role: string): string => {
  if (role === 'user') return 'User messages';
  if (role === 'assistant') return 'Assistant replies';
  return `${role || 'Other'} messages`;
};

const createMetricCards = (report: AnalyticsReport | null): MetricCard[] => {
  const summary = report?.summary;
  return [
    {
      label: 'Conversations',
      value: formatNumber(summary?.totalConversations ?? 0),
      note: 'Created in range',
      icon: 'forum',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Messages',
      value: formatNumber(summary?.totalMessages ?? 0),
      note: `${formatNumber(summary?.userMessages ?? 0)} sent by user`,
      icon: 'chat_bubble',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-100 dark:bg-sky-900/30',
    },
    {
      label: 'Estimated Tokens',
      value: formatCompactNumber(summary?.estimatedTokens ?? 0),
      note: 'Estimated from saved text',
      icon: 'generating_tokens',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'Active Days',
      value: formatNumber(summary?.activeDays ?? 0),
      note: `${summary?.avgMessagesPerConversation ?? 0} avg messages/conversation`,
      icon: 'calendar_month',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ];
};

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      {payload.map((entry) => (
        <p key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium">{formatNumber(Number(entry.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<AnalyticsRange>('7d');
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const theme = useSelector((state: RootState) => state.app.theme);
  const token = useSelector((state: RootState) => state.auth.token);

  const chartColors = useMemo(
    () => ({
      primary: '#7c3aed',
      secondary: '#0f766e',
      tertiary: '#ea580c',
      grid: theme === 'dark' ? '#334155' : '#e2e8f0',
      text: theme === 'dark' ? '#94a3b8' : '#64748b',
      border: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    }),
    [theme]
  );

  const metricCards = useMemo(() => createMetricCards(report), [report]);
  const roleData = useMemo(
    () => report?.roleBreakdown.map((item) => ({ name: getRoleLabel(item.role), messages: item.messages })) ?? [],
    [report]
  );
  const hasUsage = Boolean(report && report.summary.totalMessages > 0);

  useEffect(() => {
    let isActive = true;

    const loadReport = async (): Promise<void> => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const usageReport = await analyticsApi.getUsageReport(dateRange, token);
        if (isActive) {
          setReport(usageReport);
        }
      } catch {
        if (isActive) {
          setError('Unable to load analytics report right now.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadReport();
    const intervalId = window.setInterval(loadReport, ANALYTICS_REFRESH_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [dateRange, reloadToken, token]);

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bright pb-12 font-['Inter'] dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-slate-200">Analytics</h1>
            <p className="mt-1 text-on-surface-variant dark:text-slate-400">
              Conversation usage, activity, and estimated message volume from backend history.
            </p>
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as AnalyticsRange)}
              className="w-full appearance-none rounded-lg border border-outline-variant bg-white px-4 py-2.5 pr-10 font-medium text-on-surface shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              {ANALYTICS_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              expand_more
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadToken((current) => current + 1)} className="font-semibold hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.bg} ${metric.color}`}>
                  <span className="material-symbols-outlined">{metric.icon}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {isLoading ? 'Syncing' : 'Live'}
                </span>
              </div>
              <p className="mb-1 text-sm font-medium text-on-surface-variant dark:text-slate-400">{metric.label}</p>
              <h3 className="text-2xl font-bold text-on-surface dark:text-slate-200">{metric.value}</h3>
              <p className="mt-2 text-xs text-on-surface-variant dark:text-slate-500">{metric.note}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Usage Over Time</h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400">Messages and estimated tokens grouped by day.</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report?.dailyUsage ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="label" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} tickLine={false} axisLine={false} dx={10} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="messages" name="Messages" stroke={chartColors.primary} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="estimatedTokens" name="Estimated tokens" stroke={chartColors.secondary} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {!hasUsage && !isLoading && (
          <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-on-surface dark:text-slate-200">No conversation activity yet</h3>
            <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-400">Once users chat with agents, this page will show real backend usage data.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-outline-variant bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-6 text-lg font-bold text-on-surface dark:text-slate-200">Message Mix</h3>
            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke={chartColors.text} tick={{ fill: chartColors.text, fontSize: 12 }} width={130} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: chartColors.border }} content={<ChartTooltip />} />
                  <Bar dataKey="messages" name="Messages" fill={chartColors.tertiary} radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Recent User Prompts</h3>
              <span className="text-xs font-medium text-on-surface-variant dark:text-slate-500">Latest 8</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant text-sm text-on-surface-variant dark:border-slate-800 dark:text-slate-400">
                    <th className="px-4 pb-3 font-medium">Prompt</th>
                    <th className="px-4 pb-3 text-right font-medium">Est. Tokens</th>
                    <th className="px-4 pb-3 font-medium">Time</th>
                    <th className="px-4 pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.recentActivity ?? []).map((activity, index) => (
                    <tr
                      key={activity.id}
                      className={`text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        index !== (report?.recentActivity.length ?? 0) - 1 ? 'border-b border-outline-variant dark:border-slate-800/50' : ''
                      }`}
                    >
                      <td className="max-w-[360px] px-4 py-3 font-medium text-on-surface dark:text-slate-200" title={activity.query}>
                        {truncateText(activity.query)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-on-surface-variant dark:text-slate-400">
                        {formatNumber(activity.estimatedTokens)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant dark:text-slate-400">
                        {formatActivityTime(activity.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
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

        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 text-lg font-bold text-on-surface dark:text-slate-200">Most Active Conversations</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {(report?.topConversations ?? []).map((conversation) => (
              <div key={conversation.id} className="rounded-lg border border-outline-variant p-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-on-surface dark:text-slate-200">{formatNumber(conversation.messageCount)} messages</p>
                <p className="mt-2 min-h-10 text-xs text-on-surface-variant dark:text-slate-400">
                  {truncateText(conversation.lastMessagePreview || 'No preview available', 70)}
                </p>
                <p className="mt-3 text-xs text-slate-500">{formatActivityTime(conversation.lastMessageAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
