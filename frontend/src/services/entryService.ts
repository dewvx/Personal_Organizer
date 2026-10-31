import api from './api';
import { ApiResponse, Entry, EntryFilters } from '../types';

export const EntryService = {
  async getAll(filters?: EntryFilters): Promise<{ entries: Entry[]; meta?: any }> {
    const res = await api.get<ApiResponse<Entry[]>>('/entries', { params: filters });
    return {
      entries: res.data.data,
      meta: res.data.meta,
    };
  },

  async getById(id: number): Promise<Entry> {
    const res = await api.get<ApiResponse<Entry>>(`/entries/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Entry>): Promise<Entry> {
    const res = await api.post<ApiResponse<Entry>>('/entries', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Entry>): Promise<Entry> {
    const res = await api.put<ApiResponse<Entry>>(`/entries/${id}`, data);
    return res.data.data;
  },

  async toggleStatus(id: number, status: Entry['status']): Promise<Entry> {
    const res = await api.patch<ApiResponse<Entry>>(`/entries/${id}/status`, { status });
    return res.data.data;
  },

  async toggleFavorite(id: number, is_favorite: boolean): Promise<Entry> {
    const res = await api.patch<ApiResponse<Entry>>(`/entries/${id}/favorite`, { is_favorite });
    return res.data.data;
  },

  async toggleArchive(id: number, is_archived: boolean): Promise<Entry> {
    const res = await api.patch<ApiResponse<Entry>>(`/entries/${id}/archive`, { is_archived });
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/entries/${id}`);
  },

  async duplicate(id: number): Promise<Entry> {
    const res = await api.post<ApiResponse<Entry>>(`/entries/${id}/duplicate`);
    return res.data.data;
  },

  async archiveAllCompleted(): Promise<{ count: number }> {
    const res = await api.patch<ApiResponse<{ count: number }>>('/entries/bulk/archive-completed');
    return res.data.data;
  },

  async toggleSubItem(itemId: number, is_completed: boolean): Promise<Entry> {
    const res = await api.patch<ApiResponse<Entry>>(`/entries/items/${itemId}/toggle`, { is_completed });
    return res.data.data;
  },

  async exportData(format: 'json' | 'csv'): Promise<void> {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const downloadUrl = `${baseURL}/entries/export?format=${format}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `personal_organizer_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
