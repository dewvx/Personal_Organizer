import api from './api';
import { ApiResponse, Note, NoteFilters, JournalCalendarDay } from '../types';

export const NoteService = {
  async getAll(filters?: NoteFilters): Promise<{ notes: Note[]; meta: any }> {
    const res = await api.get<ApiResponse<Note[]>>('/notes', { params: filters });
    return {
      notes: res.data.data,
      meta: res.data.meta,
    };
  },

  async getById(id: number): Promise<Note> {
    const res = await api.get<ApiResponse<Note>>(`/notes/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Note>): Promise<Note> {
    const res = await api.post<ApiResponse<Note>>('/notes', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Note>): Promise<Note> {
    const res = await api.put<ApiResponse<Note>>(`/notes/${id}`, data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  async togglePin(id: number): Promise<Note> {
    const res = await api.patch<ApiResponse<Note>>(`/notes/${id}/pin`);
    return res.data.data;
  },

  async toggleArchive(id: number): Promise<Note> {
    const res = await api.patch<ApiResponse<Note>>(`/notes/${id}/archive`);
    return res.data.data;
  },

  async getJournalCalendar(params?: { year?: number; month?: number }): Promise<JournalCalendarDay[]> {
    const res = await api.get<ApiResponse<JournalCalendarDay[]>>('/notes/journal/calendar', { params });
    return res.data.data;
  },
};
