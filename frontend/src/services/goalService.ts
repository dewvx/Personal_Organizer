import api from './api';
import { ApiResponse, Goal, GoalFormData, Entry } from '../types';

export const GoalService = {
  async getAll(status?: string): Promise<Goal[]> {
    const params = status && status !== 'all' ? { status } : {};
    const res = await api.get<ApiResponse<Goal[]>>('/goals', { params });
    return res.data.data;
  },

  async getById(id: number): Promise<Goal> {
    const res = await api.get<ApiResponse<Goal>>(`/goals/${id}`);
    return res.data.data;
  },

  async getEntries(id: number): Promise<Entry[]> {
    const res = await api.get<ApiResponse<Entry[]>>(`/goals/${id}/entries`);
    return res.data.data;
  },

  async create(data: GoalFormData): Promise<Goal> {
    const res = await api.post<ApiResponse<Goal>>('/goals', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<GoalFormData>): Promise<Goal> {
    const res = await api.put<ApiResponse<Goal>>(`/goals/${id}`, data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/goals/${id}`);
  },
};
