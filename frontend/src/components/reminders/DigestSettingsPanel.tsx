import React, { useState, useEffect } from 'react';
import { X, Sun, Calendar, Check } from 'lucide-react';
import { ReminderSettings } from '../../types';
import { ReminderService } from '../../services/reminderService';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface DigestSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigestSettingsPanel: React.FC<DigestSettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<ReminderSettings>({
    daily_digest_enabled: false,
    daily_digest_time: '07:30',
    weekly_summary_enabled: false,
    weekly_summary_day: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      ReminderService.getSettings()
        .then((s) => setSettings(s))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ReminderService.updateSettings(settings);
      showToast('บันทึกการตั้งค่าสรุปประจำวันเรียบร้อย');
      onClose();
    } catch (err) {
      showToast('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              สรุปอัตโนมัติ (Digest & Summary)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Daily Digest */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  สรุปภารกิจยามเช้า (Daily Morning Digest)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ส่งแจ้งเตือนสรุปงานค้างและนิสัยที่ต้องทำในแต่ละเช้า
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.daily_digest_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, daily_digest_enabled: e.target.checked })
                }
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {settings.daily_digest_enabled && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  เวลาที่ต้องการให้ส่ง:
                </span>
                <input
                  type="time"
                  value={settings.daily_digest_time}
                  onChange={(e) =>
                    setSettings({ ...settings, daily_digest_time: e.target.value })
                  }
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Weekly Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  สรุปผลงานรายสัปดาห์ (Weekly Summary)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ส่งสรุปจำนวนงานที่ทำสำเร็จตลอดสัปดาห์ ทุกวันอาทิตย์ตอนค่ำ
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.weekly_summary_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, weekly_summary_enabled: e.target.checked })
                }
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
