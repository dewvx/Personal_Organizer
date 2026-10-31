import React, { useState, useMemo } from 'react';
import { Zap, Mic, MicOff, Send, Calendar, Tag, DollarSign, AlertCircle } from 'lucide-react';
import { Category } from '../../types';
import { parseQuickEntry } from '../../utils/quickCaptureParser';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { EntryService } from '../../services/entryService';
import { useToast } from '../../context/ToastContext';
import { triggerHaptic } from '../../utils/haptics';

interface QuickCaptureBarProps {
  categories: Category[];
  onEntryCreated: () => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({
  categories,
  onEntryCreated,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const { isListening, isSupported, toggleListening } =
    useSpeechRecognition({
      lang: 'th-TH',
      onResult: (text) => {
        setInputText(text);
      },
    });

  // Parse text in real-time
  const parsed = useMemo(() => {
    if (!inputText.trim()) return null;
    return parseQuickEntry(inputText, categories);
  }, [inputText, categories]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    const dataToSave = parsed || parseQuickEntry(inputText, categories);

    try {
      setIsSubmitting(true);
      triggerHaptic('medium');

      await EntryService.create({
        title: dataToSave.title,
        amount: dataToSave.amount,
        due_date: dataToSave.due_date,
        priority: dataToSave.priority,
        tags: dataToSave.tags,
        category_id: dataToSave.matchedCategory ? dataToSave.matchedCategory.id : undefined,
        status: 'pending',
      });

      triggerHaptic('success');
      showToast(`จดด่วนสำเร็จ: "${dataToSave.title}"`, 'success');
      setInputText('');
      if (isListening) toggleListening();
      onEntryCreated();
    } catch (err: any) {
      triggerHaptic('warning');
      showToast('ไม่สามารถบันทึกรายการด่วนได้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMic = () => {
    triggerHaptic('light');
    toggleListening();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 shadow-sm transition-all hover:border-indigo-400 dark:hover:border-indigo-600/70">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-indigo-200 dark:shadow-none">
          <Zap className="w-4 h-4 fill-white text-white" />
        </div>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="จดด่วน 3 วินาที... เช่น ซื้อนม 45 บ. พรุ่งนี้ #ช้อปปิ้ง"
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none px-1"
        />

        {/* Speech Recognition Mic Button */}
        {isSupported && (
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-950/60'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isListening ? 'กดเพื่อหยุดฟังเสียง' : 'พูดบันทึกด้วยเสียงภาษาไทย'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <button
          type="submit"
          disabled={!inputText.trim() || isSubmitting}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">จดด่วน</span>
        </button>
      </form>

      {/* Real-time Smart NLP-lite Detection Preview Pills */}
      {parsed && (parsed.amount !== null || parsed.due_date || parsed.tags.length > 0 || parsed.matchedCategory || parsed.priority !== 'medium') && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] animate-in fade-in duration-150">
          <span className="text-slate-400 font-medium">ตรวจพบ:</span>

          {parsed.matchedCategory && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium"
              style={{
                backgroundColor: `${parsed.matchedCategory.color}15`,
                color: parsed.matchedCategory.color,
              }}
            >
              หมวดหมู่: {parsed.matchedCategory.name}
            </span>
          )}

          {parsed.amount !== null && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-200/60 dark:border-emerald-800/60">
              <DollarSign className="w-3 h-3" />
              {parsed.amount.toLocaleString()} ฿
            </span>
          )}

          {parsed.due_date && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-medium border border-sky-200/60 dark:border-sky-800/60">
              <Calendar className="w-3 h-3" />
              กำหนด: {parsed.due_date}
            </span>
          )}

          {parsed.priority !== 'medium' && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium ${
                parsed.priority === 'urgent'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  : parsed.priority === 'high'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              ความสำคัญ: {parsed.priority}
            </span>
          )}

          {parsed.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200/60 dark:border-indigo-800/60"
            >
              <Tag className="w-2.5 h-2.5" />#{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
