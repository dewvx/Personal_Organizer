import api from './api';
import { ApiResponse, Entry, EntryFilters } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { OfflineStorage } from './offlineStorage';

export const EntryService = {
  async getAll(filters?: EntryFilters): Promise<{ entries: Entry[]; meta?: any }> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedEntries();
      let filtered = [...cached];

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            (e.description && e.description.toLowerCase().includes(q))
        );
      }
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter((e) => e.status === filters.status);
      }
      if (filters?.category_id) {
        filtered = filtered.filter((e) => e.category_id === Number(filters.category_id));
      }
      if (filters?.is_favorite !== undefined) {
        filtered = filtered.filter((e) => e.is_favorite === (filters.is_favorite === true || filters.is_favorite === 'true'));
      }
      if (filters?.is_archived !== undefined) {
        filtered = filtered.filter((e) => e.is_archived === (filters.is_archived === true || filters.is_archived === 'true'));
      }

      return {
        entries: filtered,
        meta: {
          total: filtered.length,
          page: 1,
          limit: filtered.length || 50,
          totalPages: 1,
        },
      };
    }

    try {
      const res = await api.get<ApiResponse<Entry[]>>('/entries', { params: filters });
      // Background cache all entries for offline use
      if (!filters || Object.keys(filters).length === 0) {
        OfflineStorage.saveEntries(res.data.data).catch(() => {});
      }
      return {
        entries: res.data.data,
        meta: res.data.meta,
      };
    } catch (err) {
      const cached = await OfflineStorage.getCachedEntries();
      if (cached.length > 0) {
        return {
          entries: cached,
          meta: { total: cached.length, page: 1, limit: cached.length, totalPages: 1 },
        };
      }
      throw err;
    }
  },

  async getById(id: number): Promise<Entry> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedEntries();
      const found = cached.find((e) => e.id === id);
      if (found) return found;
    }

    try {
      const res = await api.get<ApiResponse<Entry>>(`/entries/${id}`);
      return res.data.data;
    } catch (err) {
      const cached = await OfflineStorage.getCachedEntries();
      const found = cached.find((e) => e.id === id);
      if (found) return found;
      throw err;
    }
  },

  async create(data: Partial<Entry>): Promise<Entry> {
    if (!navigator.onLine) {
      // Create local optimistic entry with unique negative temp ID
      const tempId = -Date.now();
      const localEntry: Entry = {
        id: tempId,
        title: data.title || '',
        description: data.description || null,
        category_id: data.category_id || null,
        goal_id: data.goal_id || null,
        entry_date: data.entry_date || getTodayDateString(),
        due_date: data.due_date || null,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        amount: data.amount !== undefined ? data.amount : null,
        quantity: data.quantity !== undefined ? data.quantity : null,
        tags: data.tags || [],
        is_favorite: data.is_favorite || false,
        is_archived: data.is_archived || false,
        recurring: data.recurring || 'none',
        items: data.items || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await OfflineStorage.saveCachedEntry(localEntry);
      await OfflineStorage.queueOutbox({ type: 'CREATE_ENTRY', payload: { ...data, clientTempId: tempId } });
      return localEntry;
    }

    const cleanData = { ...data };
    delete (cleanData as any).clientTempId;
    const res = await api.post<ApiResponse<Entry>>('/entries', cleanData);
    // Update local cache
    OfflineStorage.saveCachedEntry(res.data.data).catch(() => {});
    return res.data.data;
  },

  async update(id: number, data: Partial<Entry>): Promise<Entry> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedEntries();
      const existing = cached.find((e) => e.id === id);
      const updatedEntry: Entry = {
        ...(existing || ({} as Entry)),
        ...data,
        id,
        updated_at: new Date().toISOString(),
      } as Entry;

      await OfflineStorage.saveCachedEntry(updatedEntry);
      await OfflineStorage.queueOutbox({ type: 'UPDATE_ENTRY', payload: { id, data } });
      return updatedEntry;
    }

    const res = await api.put<ApiResponse<Entry>>(`/entries/${id}`, data);
    OfflineStorage.saveCachedEntry(res.data.data).catch(() => {});
    return res.data.data;
  },

  async toggleStatus(id: number, status: Entry['status']): Promise<Entry> {
    return this.updateStatus(id, status);
  },

  async updateStatus(id: number, status: Entry['status']): Promise<Entry> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedEntries();
      const existing = cached.find((e) => e.id === id);
      if (existing) {
        existing.status = status;
        await OfflineStorage.saveCachedEntry(existing);
      }
      await OfflineStorage.queueOutbox({ type: 'TOGGLE_STATUS', payload: { id, status } });
      return (existing || { id, status }) as Entry;
    }

    const res = await api.patch<ApiResponse<Entry>>(`/entries/${id}/status`, { status });
    return res.data.data;
  },

  async toggleFavorite(id: number, is_favorite: boolean): Promise<Entry> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedEntries();
      const existing = cached.find((e) => e.id === id);
      if (existing) {
        existing.is_favorite = is_favorite;
        await OfflineStorage.saveCachedEntry(existing);
      }
      return (existing || { id, is_favorite }) as Entry;
    }

    const res = await api.patch<ApiResponse<Entry>>(`/entries/${id}/favorite`, { is_favorite });
    return res.data.data;
  },

  async toggleArchive(id: number, is_archived: boolean): Promise<Entry> {
    if (!navigator.onLine) {
      const cached = await OfflineStorage.getCachedEntries();
      const existing = cached.find((e) => e.id === id);
      if (existing) {
        existing.is_archived = is_archived;
        await OfflineStorage.saveCachedEntry(existing);
      }
      return (existing || { id, is_archived }) as Entry;
    }

    const res = await api.patch<ApiResponse<Entry>>(`/entries/${id}/archive`, { is_archived });
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    if (!navigator.onLine) {
      await OfflineStorage.deleteCachedEntry(id);
      await OfflineStorage.queueOutbox({ type: 'DELETE_ENTRY', payload: { id } });
      return;
    }

    await api.delete(`/entries/${id}`);
    OfflineStorage.deleteCachedEntry(id).catch(() => {});
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
    link.setAttribute('download', `personal_organizer_${getTodayDateString()}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async importData(entries: any[], strategy: 'append' | 'overwrite' = 'append'): Promise<{ importedCount: number }> {
    const res = await api.post<ApiResponse<{ imported_count: number; strategy: string; items_created: number }>>(
      '/entries/import',
      { entries, strategy }
    );
    return {
      importedCount: res.data.data.imported_count,
    };
  },

  async importEntries(data: { entries: any[]; strategy?: 'append' | 'overwrite' }): Promise<{
    imported_count: number;
    strategy: string;
    items_created: number;
  }> {
    const res = await api.post<ApiResponse<{ imported_count: number; strategy: string; items_created: number }>>(
      '/entries/import',
      data
    );
    return res.data.data;
  },
};
