import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  X,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  KeyRound,
} from 'lucide-react';
import { encryptBackup, decryptBackup } from '../../utils/cryptoBackup';
import { EntryService } from '../../services/entryService';
import { CategoryService } from '../../services/categoryService';
import { HabitService } from '../../services/habitService';
import { GoalService } from '../../services/goalService';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from '../../context/ToastContext';
import { getTodayDateString } from '../../utils/dateUtils';

interface EncryptedBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export const EncryptedBackupModal: React.FC<EncryptedBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [decryptedPreview, setDecryptedPreview] = useState<any | null>(null);
  const [restoreStrategy, setRestoreStrategy] = useState<'append' | 'overwrite'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || passphrase.length < 4) {
      setError('กรุณากำหนดรหัสผ่านสำหรับการเข้ารหัสอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Collect all data from services
      const [entriesRes, categories, habits, goals] = await Promise.all([
        EntryService.getAll({ limit: 1000 }),
        CategoryService.getAll().catch(() => []),
        HabitService.getAll().catch(() => []),
        GoalService.getAll().catch(() => []),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        entries: entriesRes.entries || [],
        categories: categories || [],
        habits: habits || [],
        goals: goals || [],
      };

      // Encrypt with AES-GCM 256-bit + PBKDF2
      const encryptedPackage = await encryptBackup(backupData, passphrase);

      // Trigger download .poenc file
      const blob = new Blob([encryptedPackage], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `personal_organizer_backup_${getTodayDateString()}.poenc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast('สำรองข้อมูลเข้ารหัส AES-256 สำเร็จแล้ว!', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูล');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFileName(file.name);
      setDecryptedPreview(null);
      setError('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setRestoreFileContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleDecryptFile = async () => {
    if (!restoreFileContent) {
      setError('กรุณาเลือกไฟล์สำรองข้อมูล (.poenc)');
      return;
    }
    if (!restorePassphrase) {
      setError('กรุณาระบุรหัสผ่านเพื่อถอดรหัส');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      const data = await decryptBackup(restoreFileContent, restorePassphrase);
      setDecryptedPreview(data);
      showToast('ถอดรหัสข้อมูลสำเร็จ ตรวจสอบความถูกต้องก่อนกู้คืน', 'success');
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถถอดรหัสข้อมูลได้');
      setDecryptedPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!decryptedPreview || !decryptedPreview.entries) {
      setError('ไม่มีข้อมูลสำหรับกู้คืน');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      await EntryService.importEntries({
        entries: decryptedPreview.entries,
        strategy: restoreStrategy,
      });

      showToast(`กู้คืนข้อมูลสำเร็จ (${decryptedPreview.entries.length} รายการ)`, 'success');
      onRestoreSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-lg border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  สำรองและกู้คืนข้อมูลเข้ารหัส (Encrypted Backup)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ความปลอดภัยระดับทหาร AES-256-GCM (Zero-Knowledge)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl my-3">
            <button
              onClick={() => {
                setActiveTab('export');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>สำรองข้อมูลเข้ารหัส</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('restore');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'restore'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>กู้คืนข้อมูล</span>
            </button>
          </div>

          {error && (
            <div className="p-3 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* TAB 1: EXPORT ENCRYPTED BACKUP */}
          {activeTab === 'export' && (
            <form onSubmit={handleExport} className="space-y-4 py-1">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>การเข้ารหัสลับส่วนบุคคล (Zero-Knowledge)</span>
                </p>
                <p className="text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300">
                  ข้อมูลจะถูกเข้ารหัสในเบราว์เซอร์ของคุณก่อนส่งออก ไม่มีใครสามารถเปิดอ่านข้อมูลได้หากไม่มีรหัสผ่านนี้ กรุณาจดจำรหัสผ่านให้แม่นยำ
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ตั้งรหัสผ่านสำหรับไฟล์สำรอง (Master Passphrase / PIN)
                </label>
                <Input
                  type="password"
                  placeholder="เช่น รหัสผ่านลับอย่างน้อย 4 ตัวอักษร"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ยืนยันรหัสผ่านอีกครั้ง
                </label>
                <Input
                  type="password"
                  placeholder="พิมพ์รหัสผ่านเดิมซ้ำ"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                  ยกเลิก
                </Button>
                <Button type="submit" isLoading={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  <Download className="w-4 h-4 mr-1.5" />
                  <span>ส่งออกไฟล์ (.poenc)</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: RESTORE ENCRYPTED BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  เลือกไฟล์สำรองข้อมูลที่เข้ารหัส (.poenc)
                </label>
                <input
                  type="file"
                  accept=".poenc,.json"
                  onChange={handleFileSelect}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {restoreFileName && (
                  <p className="text-[11px] text-slate-500 mt-1">ไฟล์ที่เลือก: {restoreFileName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  รหัสผ่านถอดรหัส (Passphrase ที่ใช้ตอนสำรองข้อมูล)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="พิมพ์รหัสผ่าน"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={handleDecryptFile}
                    isLoading={isProcessing && !decryptedPreview}
                    disabled={!restoreFileContent || !restorePassphrase}
                  >
                    ถอดรหัส
                  </Button>
                </div>
              </div>

              {/* Decrypted Preview Details */}
              {decryptedPreview && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ถอดรหัสสำเร็จ! รายละเอียดข้อมูลในไฟล์:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <div>• รายการงาน: {decryptedPreview.entries?.length || 0} รายการ</div>
                    <div>• หมวดหมู่: {decryptedPreview.categories?.length || 0} หมวด</div>
                    <div>• กิจวัตร: {decryptedPreview.habits?.length || 0} รายการ</div>
                    <div>• เป้าหมาย: {decryptedPreview.goals?.length || 0} เป้าหมาย</div>
                  </div>

                  {/* Strategy Choice */}
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                      รูปแบบการกู้คืน:
                    </label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="strategy"
                          checked={restoreStrategy === 'append'}
                          onChange={() => setRestoreStrategy('append')}
                        />
                        <span>เพิ่มต่อท้าย (Append)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="strategy"
                          checked={restoreStrategy === 'overwrite'}
                          onChange={() => setRestoreStrategy('overwrite')}
                        />
                        <span>ล้างข้อมูลเก่าและแทนที่ (Overwrite)</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleExecuteRestore}
                    isLoading={isProcessing}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    ยืนยันกู้คืนข้อมูลเข้าสู่ระบบ
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
