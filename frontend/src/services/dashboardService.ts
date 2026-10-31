import api from './api';
import { ApiResponse, DashboardSummaryData, MonthlyReportData, DashboardWidgetItem } from '../types';

export const DashboardService = {
  async getSummary(): Promise<DashboardSummaryData> {
    const res = await api.get<ApiResponse<DashboardSummaryData>>('/dashboard/summary');
    return res.data.data;
  },

  async getMonthlyReport(year?: number, month?: number): Promise<MonthlyReportData> {
    const params = year && month ? { year, month } : {};
    const res = await api.get<ApiResponse<MonthlyReportData>>('/dashboard/reports/monthly', { params });
    return res.data.data;
  },

  async getLayout(): Promise<DashboardWidgetItem[]> {
    const res = await api.get<ApiResponse<DashboardWidgetItem[]>>('/dashboard/layout');
    return res.data.data;
  },

  async updateLayout(layout: DashboardWidgetItem[]): Promise<DashboardWidgetItem[]> {
    const res = await api.put<ApiResponse<DashboardWidgetItem[]>>('/dashboard/layout', { layout });
    return res.data.data;
  },
};
