import api from './api';
import { ApiResponse, DashboardSummaryData } from '../types';

export const DashboardService = {
  async getSummary(): Promise<DashboardSummaryData> {
    const res = await api.get<ApiResponse<DashboardSummaryData>>('/dashboard/summary');
    return res.data.data;
  },
};
