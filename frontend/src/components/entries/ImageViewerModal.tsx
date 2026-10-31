import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { EntryAttachment } from '../../types';
import { AttachmentService } from '../../services/attachmentService';

interface ImageViewerModalProps {
  attachment: EntryAttachment | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  attachment,
  onClose,
}) => {
  if (!attachment) return null;

  const url = AttachmentService.getAttachmentUrl(attachment);
  const isPdf = attachment.mime_type === 'application/pdf' || attachment.file_name.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-4 text-left shadow-2xl transition-all w-full max-w-3xl flex flex-col max-h-[90vh]">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white">
            <div className="min-w-0 pr-3">
              <h4 className="text-sm font-bold truncate">{attachment.file_name}</h4>
              <p className="text-[11px] text-slate-400">
                {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.mime_type}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={url}
                download={attachment.file_name}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="ดาวน์โหลดหรือเปิดในแท็บใหม่"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center py-4 bg-slate-950/60 rounded-2xl my-2">
            {isPdf ? (
              <div className="text-center p-8 text-white space-y-3">
                <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold">{attachment.file_name}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>เปิดดูไฟล์ PDF</span>
                </a>
              </div>
            ) : (
              <img
                src={url}
                alt={attachment.file_name}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
