import { useState, useEffect, useCallback } from 'react';
import { OfflineStorage, OutboxItem } from '../services/offlineStorage';
import { EntryService } from '../services/entryService';
import { HabitService } from '../services/habitService';
import { useToast } from '../context/ToastContext';

export function useNetworkSync(onSyncComplete?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const { showToast } = useToast();

  const refreshPendingCount = useCallback(async () => {
    try {
      const outbox = await OfflineStorage.getOutbox();
      setPendingCount(outbox.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncOutbox = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      const outbox = await OfflineStorage.getOutbox();
      if (outbox.length === 0) {
        setPendingCount(0);
        return;
      }

      setIsSyncing(true);
      let successCount = 0;
      const tempIdMap = new Map<number, number>();

      for (const item of outbox) {
        try {
          if (item.type === 'CREATE_ENTRY') {
            const clientTempId = item.payload?.clientTempId;
            const created = await EntryService.create(item.payload);
            if (clientTempId && created?.id) {
              tempIdMap.set(clientTempId, created.id);
              await OfflineStorage.deleteCachedEntry(clientTempId);
              await OfflineStorage.saveCachedEntry(created);
            }
          } else if (item.type === 'UPDATE_ENTRY') {
            const targetId = tempIdMap.has(item.payload.id) ? tempIdMap.get(item.payload.id)! : item.payload.id;
            if (targetId > 0) {
              await EntryService.update(targetId, item.payload.data);
            }
          } else if (item.type === 'DELETE_ENTRY') {
            const targetId = tempIdMap.has(item.payload.id) ? tempIdMap.get(item.payload.id)! : item.payload.id;
            if (targetId > 0) {
              await EntryService.delete(targetId);
            } else {
              // Deleted before reaching server
              await OfflineStorage.deleteCachedEntry(targetId);
            }
          } else if (item.type === 'TOGGLE_STATUS') {
            const targetId = tempIdMap.has(item.payload.id) ? tempIdMap.get(item.payload.id)! : item.payload.id;
            if (targetId > 0) {
              await EntryService.updateStatus(targetId, item.payload.status);
            }
          } else if (item.type === 'TOGGLE_HABIT') {
            await HabitService.toggleLog(item.payload.id, item.payload.date);
          }

          if (item.id) {
            await OfflineStorage.removeOutbox(item.id);
            successCount++;
          }
        } catch (itemErr) {
          console.error('Failed to sync outbox item', item, itemErr);
          // If server error, keep in outbox to retry next time
        }
      }

      await refreshPendingCount();

      if (successCount > 0) {
        showToast(`ซิงค์ข้อมูล ${successCount} รายการที่ทำไว้ออฟไลน์เรียบร้อยแล้ว`, 'success');
        if (onSyncComplete) {
          onSyncComplete();
        }
      }
    } catch (err) {
      console.error('Sync process error', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onSyncComplete, refreshPendingCount, showToast]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      showToast('เชื่อมต่ออินเทอร์เน็ตแล้ว กำลังเริ่มซิงค์ข้อมูล...', 'info');
      syncOutbox();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('เข้าสู่โหมดออฟไลน์ คุณยังสามารถจดบันทึกและจัดการงานได้ตามปกติ', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check if online
    if (navigator.onLine) {
      syncOutbox();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPendingCount, showToast, syncOutbox]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow: syncOutbox,
    refreshPendingCount,
  };
}
