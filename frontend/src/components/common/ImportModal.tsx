import React, { useState, useRef } from 'react';
import { UploadCloud, FileJson, AlertTriangle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { EntryService } from '../../services/entryService';
import { useToast } from '../../context/ToastContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parsedEntries, setParsedEntries] = useState<any[]>([]);
  const [strategy, setStrategy] = useState<'append' | 'overwrite'>('append');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFileName('');
    setFileSize('');
    setParsedEntries([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          const entries = Array.isArray(json) ? json : json.entries || [];
          if (!Array.isArray(entries) || entries.length === 0) {
            throw new Error('ไม่พบรายการข้อมูลในไฟล์ JSON');
          }
          setParsedEntries(entries);
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            throw new Error('ไฟล์ CSV ว่างเปล่าหรือไม่มีข้อมูล');
          }
          // Simple CSV parser for entries
          const headers = lines[0].split(',').map((h) => h.replace(/^["\uFEFF]|["\s]/g, '').toLowerCase());
          const entries = [];
          for (let i = 1; i < lines.length; i++) {
            const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
            const values = [];
            let match;
            while ((match = regex.exec(lines[i])) !== null) {
              values.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
            }
            if (values.length > 1 && values[1]) {
              const titleIdx = headers.indexOf('title') !== -1 ? headers.indexOf('title') : 1;
              const catIdx = headers.indexOf('category') !== -1 ? headers.indexOf('category') : 2;
              const statusIdx = headers.indexOf('status') !== -1 ? headers.indexOf('status') : 3;
              const priorityIdx = headers.indexOf('priority') !== -1 ? headers.indexOf('priority') : 4;
              const amountIdx = headers.indexOf('amount (thb)') !== -1 ? headers.indexOf('amount (thb)') : 5;
              const entryDateIdx = headers.indexOf('entry date') !== -1 ? headers.indexOf('entry date') : 7;
              const dueDateIdx = headers.indexOf('due date') !== -1 ? headers.indexOf('due date') : 8;

              entries.push({
                title: values[titleIdx] || 'รายการนำเข้า',
                category_name: values[catIdx] || undefined,
                status: values[statusIdx] || 'pending',
                priority: values[priorityIdx] || 'medium',
                amount: values[amountIdx] ? parseFloat(values[amountIdx]) : null,
                entry_date: values[entryDateIdx] || undefined,
                due_date: values[dueDateIdx] || undefined,
              });
            }
          }
          if (entries.length === 0) {
            throw new Error('ไม่พบข้อมูลรายการที่นำเข้าได้จาก CSV');
          }
          setParsedEntries(entries);
        } else {
          throw new Error('รองรับเฉพาะไฟล์ .json หรือ .csv เท่านั้น');
        }
      } catch (err: any) {
        setError(err.message || 'โครงสร้างไฟล์ไม่ถูกต้อง');
        setParsedEntries([]);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedEntries.length === 0) return;
    try {
      setIsLoading(true);
      const res = await EntryService.importData(parsedEntries, strategy);
      showToast(`กู้คืนข้อมูลสำเร็จ: นำเข้า ${res.importedCount} รายการ`, 'success');
      onSuccess();
      onClose();
      handleReset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">นำเข้าและกู้คืนข้อมูล (Import & Restore)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">กู้คืนไฟล์สำรอง JSON หรือ CSV กลับสู่ฐานข้อมูล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* File Dropzone */}
          {parsedEntries.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">รองรับไฟล์สำรอง .json หรือ .csv จาก Personal Organizer</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Card */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{fileName}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {fileSize} • ตรวจพบ <span className="font-bold underline">{parsedEntries.length} รายการ</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-rose-500 underline ml-2 flex-shrink-0"
                >
                  เปลี่ยนไฟล์
                </button>
              </div>

              {/* Sample preview list */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">ตัวอย่างรายการที่จะนำเข้า:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {parsedEntries.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                        {item.category_name || 'ทั่วไป'} {item.amount ? `(${item.amount}฿)` : ''}
                      </span>
                    </div>
                  ))}
                  {parsedEntries.length > 3 && (
                    <p className="text-[11px] text-center text-slate-400 pt-1">
                      ...และอีก {parsedEntries.length - 3} รายการ
                    </p>
                  )}
                </div>
              </div>

              {/* Strategy Options */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  รูปแบบการกู้คืนข้อมูล (Import Strategy):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStrategy('append')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      strategy === 'append'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">เพิ่มต่อจากเดิม</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      คงข้อมูลเดิมไว้ และเพิ่มข้อมูลใหม่เข้าไป
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStrategy('overwrite')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      strategy === 'overwrite'
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/60 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>เขียนทับทั้งหมด</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ล้างข้อมูลเดิม แล้วแทนที่ด้วยไฟล์นี้
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} size="sm">
            ยกเลิก
          </Button>
          <Button
            onClick={handleExecuteImport}
            disabled={parsedEntries.length === 0 || isLoading}
            isLoading={isLoading}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {strategy === 'overwrite' ? 'ยืนยันเขียนทับและกู้คืน' : 'กู้คืนข้อมูล'}
          </Button>
        </div>
      </div>
    </div>
  );
};
