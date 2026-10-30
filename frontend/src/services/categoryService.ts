import api from './api';
import { ApiResponse, Category } from '../types';

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  async getById(id: number): Promise<Category> {
    const res = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data.data;
  },

  async create(data: { name: string; description?: string; icon?: string; color?: string; sort_order?: number }): Promise<Category> {
    const res = await api.post<ApiResponse<Category>>('/categories', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
