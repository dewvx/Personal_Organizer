import api from './api';
import { ApiResponse, Category } from '../types';
import { OfflineStorage } from './offlineStorage';

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedCategories();
      if (cached.length > 0) return cached;
    }

    try {
      const res = await api.get<ApiResponse<Category[]>>('/categories');
      // Background cache
      OfflineStorage.saveCategories(res.data.data).catch(() => {});
      return res.data.data;
    } catch (err) {
      const cached = await OfflineStorage.getCachedCategories();
      if (cached.length > 0) return cached;
      throw err;
    }
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
