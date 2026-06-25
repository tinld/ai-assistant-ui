import type { AnalyticsRange } from '../constants/analytics.constants';

export interface AnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  estimatedTokens: number;
  activeDays: number;
  avgMessagesPerConversation: number;
}

export interface AnalyticsDailyUsage {
  date: string;
  label: string;
  conversations: number;
  messages: number;
  estimatedTokens: number;
}

export interface AnalyticsRoleBreakdown {
  role: string;
  messages: number;
}

export interface AnalyticsRecentActivity {
  id: string;
  conversationId?: string;
  query: string;
  createdAt?: string | null;
  estimatedTokens: number;
  status: string;
}

export interface AnalyticsTopConversation {
  id: string;
  lastMessagePreview: string;
  messageCount: number;
  lastMessageAt?: string | null;
}

export interface AnalyticsReport {
  range: AnalyticsRange;
  startAt: string;
  endAt: string;
  summary: AnalyticsSummary;
  dailyUsage: AnalyticsDailyUsage[];
  roleBreakdown: AnalyticsRoleBreakdown[];
  recentActivity: AnalyticsRecentActivity[];
  topConversations: AnalyticsTopConversation[];
}

export interface AnalyticsUsageResponse {
  success: boolean;
  report: AnalyticsReport;
}
