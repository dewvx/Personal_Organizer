import api from './api';
import { ApiResponse, Habit } from '../types';

export const HabitService = {
  async getAll(): Promise<Habit[]> {
    const res = await api.get<ApiResponse<Habit[]>>('/habits');
    return res.data.data;
  },

  async getById(id: number): Promise<Habit> {
    const res = await api.get<ApiResponse<Habit>>(`/habits/${id}`);
    return res.data.data;
  },

  async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequency?: string;
    target_days?: number;
    sort_order?: number;
  }): Promise<Habit> {
    const res = await api.post<ApiResponse<Habit>>('/habits', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Habit>): Promise<Habit> {
    const res = await api.put<ApiResponse<Habit>>(`/habits/${id}`, data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/habits/${id}`);
  },

  async toggleLog(id: number, log_date?: string): Promise<{ habitId: number; logDate: string; is_completed: boolean }> {
    const res = await api.post<ApiResponse<{ habitId: number; logDate: string; is_completed: boolean }>>(
      `/habits/${id}/toggle`,
      { log_date }
    );
    return res.data.data;
  },
};
