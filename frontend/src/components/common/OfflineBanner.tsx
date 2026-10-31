import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  onSyncNow?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  isSyncing,
  pendingCount,
  onSyncNow,
}) => {
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 w-full transition-all duration-300">
      {!isOnline ? (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse flex-shrink-0" />
            <span>
              <strong>โหมดออฟไลน์:</strong> คุณสามารถจดบันทึกและจัดการงานได้ตามปกติ ระบบจะซิงค์ขึ้นเซิร์ฟเวอร์ให้อัตโนมัติเมื่อต่อเน็ต
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="bg-amber-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ml-2">
              รอซิงค์ {pendingCount} รายการ
            </span>
          )}
        </div>
      ) : isSyncing ? (
        <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>กำลังซิงค์ข้อมูลที่ทำไว้ออฟไลน์ขึ้นเซิร์ฟเวอร์...</span>
          </div>
        </div>
      ) : pendingCount > 0 ? (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 flex-shrink-0" />
            <span>มีข้อมูลออฟไลน์รอซิงค์ {pendingCount} รายการ</span>
          </div>
          {onSyncNow && (
            <button
              onClick={onSyncNow}
              className="bg-emerald-700 hover:bg-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors"
            >
              ซิงค์ทันที
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
