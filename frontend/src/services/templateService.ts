import api from './api';
import { ApiResponse, Template, Entry } from '../types';

export const TemplateService = {
  async getAll(category?: string): Promise<Template[]> {
    const params = category && category !== 'all' ? { category } : {};
    const res = await api.get<ApiResponse<Template[]>>('/templates', { params });
    return res.data.data;
  },

  async getById(id: number): Promise<Template> {
    const res = await api.get<ApiResponse<Template>>(`/templates/${id}`);
    return res.data.data;
  },

  async create(data: {
    title: string;
    description?: string;
    category_name?: string;
    icon?: string;
    color?: string;
    priority?: string;
    estimated_amount?: number;
    tags?: string[];
    items?: { title: string; amount?: number; quantity?: number }[];
  }): Promise<Template> {
    const res = await api.post<ApiResponse<Template>>('/templates', data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/templates/${id}`);
  },

  async apply(id: number): Promise<Entry> {
    const res = await api.post<ApiResponse<Entry>>(`/templates/${id}/apply`);
    return res.data.data;
  },
};
