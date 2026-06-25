export const ANALYTICS_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'year', label: 'This Year' },
] as const;

export const ANALYTICS_REFRESH_INTERVAL_MS = 300000;

export type AnalyticsRange = (typeof ANALYTICS_RANGE_OPTIONS)[number]['value'];
