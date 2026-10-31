import React, { useRef, useState } from 'react';
import { Paperclip, Upload, X, Eye, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { EntryAttachment } from '../../types';
import { AttachmentService } from '../../services/attachmentService';
import { ImageViewerModal } from './ImageViewerModal';

interface AttachmentUploaderProps {
  existingAttachments?: EntryAttachment[];
  pendingFiles: File[];
  onAddPendingFiles: (files: File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onDeleteExistingAttachment?: (attachmentId: number) => Promise<void>;
  disabled?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  existingAttachments = [],
  pendingFiles,
  onAddPendingFiles,
  onRemovePendingFile,
  onDeleteExistingAttachment,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingAttachment, setViewingAttachment] = useState<EntryAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      // Validate 5MB max
      const valid = selected.filter((file) => file.size <= 5 * 1024 * 1024);
      onAddPendingFiles(valid);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      const valid = dropped.filter((file) => file.size <= 5 * 1024 * 1024);
      onAddPendingFiles(valid);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Upload Drop Zone / Button */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            รองรับรูปภาพสลิป/ใบเสร็จ (JPG, PNG, WEBP) หรือ PDF ขนาดไม่เกิน 5MB
          </p>
        </div>
      </div>

      {/* Attachments & Staged Files Preview List */}
      {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Existing uploaded attachments */}
          {existingAttachments.map((att) => {
            const isPdf = att.mime_type === 'application/pdf' || att.file_name.toLowerCase().endsWith('.pdf');
            const url = AttachmentService.getAttachmentUrl(att);

            return (
              <div
                key={`existing_${att.id}`}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs shadow-sm"
              >
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  onClick={() => setViewingAttachment(att)}
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {isPdf ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <img src={url} alt={att.file_name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {att.file_name}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => setViewingAttachment(att)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="ดูรูปภาพ"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteExistingAttachment && (
                    <button
                      type="button"
                      onClick={() => onDeleteExistingAttachment(att.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="ลบไฟล์แนบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pending files to be uploaded */}
          {pendingFiles.map((file, idx) => {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const previewUrl = !isPdf ? URL.createObjectURL(file) : '';

            return (
              <div
                key={`pending_${idx}`}
                className="flex items-center justify-between p-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {isPdf ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-medium">
                      {formatFileSize(file.size)} (พร้อมอัปโหลด)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemovePendingFile(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0 ml-2"
                  title="ยกเลิกไฟล์นี้"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageViewerModal
        attachment={viewingAttachment}
        onClose={() => setViewingAttachment(null)}
      />
    </div>
  );
};
