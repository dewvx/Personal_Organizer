import { Entry, Category, Habit } from '../types';

const DB_NAME = 'personal_organizer_offline';
const DB_VERSION = 1;

export interface OutboxItem {
  id?: number;
  type: 'CREATE_ENTRY' | 'UPDATE_ENTRY' | 'DELETE_ENTRY' | 'TOGGLE_STATUS' | 'TOGGLE_HABIT';
  payload: any;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('habits')) {
        db.createObjectStore('habits', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export const OfflineStorage = {
  // Entries Cache
  async saveEntries(entries: Entry[]): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      store.clear();
      for (const entry of entries) {
        store.put(entry);
      }
    } catch (err) {
      console.warn('Failed to cache entries to IndexedDB', err);
    }
  },

  async getCachedEntries(): Promise<Entry[]> {
    try {
      const db = await getDb();
      const tx = db.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async saveCachedEntry(entry: Entry): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction('entries', 'readwrite');
      tx.objectStore('entries').put(entry);
    } catch (err) {
      console.warn('Failed to save single cached entry', err);
    }
  },

  async deleteCachedEntry(id: number): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction('entries', 'readwrite');
      tx.objectStore('entries').delete(id);
    } catch (err) {
      console.warn('Failed to delete cached entry', err);
    }
  },

  // Categories Cache
  async saveCategories(categories: Category[]): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      store.clear();
      for (const cat of categories) {
        store.put(cat);
      }
    } catch (err) {
      console.warn('Failed to cache categories', err);
    }
  },

  async getCachedCategories(): Promise<Category[]> {
    try {
      const db = await getDb();
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  // Outbox Queue (Offline Operations to Sync when Online)
  async queueOutbox(item: Omit<OutboxItem, 'id' | 'timestamp'>): Promise<number> {
    const db = await getDb();
    const tx = db.transaction('outbox', 'readwrite');
    const store = tx.objectStore('outbox');
    return new Promise((resolve, reject) => {
      const req = store.add({
        ...item,
        timestamp: Date.now(),
      });
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  },

  async getOutbox(): Promise<OutboxItem[]> {
    try {
      const db = await getDb();
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async removeOutbox(id: number): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').delete(id);
    } catch (err) {
      console.warn('Failed to remove outbox item', err);
    }
  },
};
