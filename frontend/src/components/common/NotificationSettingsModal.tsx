import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Send, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { NotificationService } from '../../services/notificationService';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setPermission(NotificationService.getPermissionStatus());
      NotificationService.isSubscribed().then(setIsSubscribed);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSubscription = async () => {
    try {
      setIsProcessing(true);
      if (isSubscribed) {
        await NotificationService.unsubscribe();
        setIsSubscribed(false);
        showToast('ปิดการแจ้งเตือนเรียบร้อย');
      } else {
        const success = await NotificationService.subscribe();
        if (success) {
          setIsSubscribed(true);
          setPermission('granted');
          showToast('🎉 เปิดรับการแจ้งเตือนสำเร็จแล้ว!');
        } else {
          showToast('ไม่สามารถเปิดการแจ้งเตือนได้ กรุณาอนุญาตสิทธิ์ในเบราว์เซอร์', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการตั้งค่าการแจ้งเตือน', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setIsProcessing(true);
      await NotificationService.sendTest();
      showToast('ส่งการแจ้งเตือนทดสอบเรียบร้อยแล้ว');
    } catch (err) {
      showToast('ไม่สามารถส่งการแจ้งเตือนทดสอบได้', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckDue = async () => {
    try {
      setIsProcessing(true);
      const res = await NotificationService.checkDue();
      if (res.notified) {
        showToast(`ส่งการแจ้งเตือนสำหรับ ${res.dueCount} รายการที่ครบกำหนดแล้ว!`);
      } else {
        showToast(res.message || 'ไม่มีรายการที่ครบกำหนดหรือค้างส่งในวันนี้', 'info');
      }
    } catch (err) {
      showToast('ไม่สามารถตรวจสอบรายการที่ถึงกำหนดได้', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const isSupported = NotificationService.isSupported();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-md border border-slate-200/80 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              <span>การแจ้งเตือน (Push Notifications)</span>
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {!isSupported ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>เบราว์เซอร์ไม่รองรับ Web Push</span>
                </div>
                <p>เบราว์เซอร์ปัจจุบันหรือโหมดเปิดหน้าต่างนี้ไม่รองรับระบบ Service Worker Push Notifications</p>
              </div>
            ) : (
              <>
                {/* Subscription Status Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSubscribed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {isSubscribed ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือนอยู่'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isSubscribed
                          ? 'รับการเตือนกำหนดส่งและนัดหมายสำคัญ'
                          : 'คลิกเพื่อเปิดรับการแจ้งเตือนงาน'}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isSubscribed ? 'outline' : 'primary'}
                    onClick={handleToggleSubscription}
                    disabled={isProcessing || permission === 'denied'}
                  >
                    {isSubscribed ? 'ปิดการแจ้งเตือน' : 'เปิดใช้งาน'}
                  </Button>
                </div>

                {permission === 'denied' && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    สิทธิ์การแจ้งเตือนถูกบล็อกในเบราว์เซอร์ กรุณาคลิกไอคอนแม่กุญแจข้างแถบ URL เพื่ออนุญาต (Allow Notifications)
                  </div>
                )}

                {/* Actions */}
                {isSubscribed && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      เครื่องมือทดสอบ
                    </span>

                    <button
                      onClick={handleSendTest}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-indigo-500" />
                        <span>ส่งการแจ้งเตือนทดสอบ (Test Push)</span>
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">ส่งทันที</span>
                    </button>

                    <button
                      onClick={handleCheckDue}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>ตรวจสอบงานที่ถึงกำหนดวันนี้</span>
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">ตรวจเช็ค</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
