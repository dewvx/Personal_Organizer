import api from './api';
import { ApiResponse, Reminder, ReminderSettings } from '../types';

export const ReminderService = {
  async getAll(params?: { is_sent?: boolean | string; entry_id?: number; note_id?: number }): Promise<{ reminders: Reminder[]; meta: any }> {
    const res = await api.get<ApiResponse<Reminder[]>>('/reminders', { params });
    return {
      reminders: res.data.data,
      meta: res.data.meta,
    };
  },

  async getById(id: number): Promise<Reminder> {
    const res = await api.get<ApiResponse<Reminder>>(`/reminders/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Reminder>): Promise<Reminder> {
    const res = await api.post<ApiResponse<Reminder>>('/reminders', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Reminder>): Promise<Reminder> {
    const res = await api.put<ApiResponse<Reminder>>(`/reminders/${id}`, data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },

  async snooze(id: number, minutes: number = 15): Promise<Reminder> {
    const res = await api.post<ApiResponse<Reminder>>(`/reminders/${id}/snooze`, { minutes });
    return res.data.data;
  },

  async dismiss(id: number): Promise<Reminder> {
    const res = await api.post<ApiResponse<Reminder>>(`/reminders/${id}/dismiss`);
    return res.data.data;
  },

  async getSettings(): Promise<ReminderSettings> {
    const res = await api.get<ApiResponse<ReminderSettings>>('/reminders/settings');
    return res.data.data;
  },

  async updateSettings(settings: Partial<ReminderSettings>): Promise<void> {
    await api.put<ApiResponse<any>>('/reminders/settings', settings);
  },
};
