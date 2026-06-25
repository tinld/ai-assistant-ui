import { api } from './api';

import type { AnalyticsRange } from '../constants/analytics.constants';
import type { AnalyticsReport, AnalyticsUsageResponse } from '../types/analytics.types';

export const analyticsApi = {
  getUsageReport: async (range: AnalyticsRange, token: string | null): Promise<AnalyticsReport> => {
    const query = new URLSearchParams({ range });
    const response = await api.get<AnalyticsUsageResponse>(`/api/analytics/usage?${query.toString()}`, token);
    return response.report;
  },
};
