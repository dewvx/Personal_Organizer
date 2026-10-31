import { Entry } from '../types';
import { formatCurrency } from './formatters';

/**
 * Format entry details into a clean shareable message (perfect for LINE or Messenger)
 */
export const formatEntryShareText = (entry: Entry): string => {
  let text = `📋 ${entry.title}\n`;

  if (entry.category_name) {
    text += `หมวดหมู่: ${entry.category_name}\n`;
  }
  if (entry.due_date) {
    text += `กำหนด: ${entry.due_date.split('T')[0]}\n`;
  }

  // Sub-items checklist
  if (entry.items && entry.items.length > 0) {
    text += `\nรายการย่อย:\n`;
    entry.items.forEach((item, idx) => {
      const statusMark = item.is_completed ? '✅' : '⬜';
      const qty = item.quantity && item.quantity > 1 ? ` (x${item.quantity})` : '';
      const price = item.amount && item.amount > 0 ? ` - ${formatCurrency(item.amount)}` : '';
      text += `${idx + 1}. ${statusMark} ${item.title}${qty}${price}\n`;
    });
  }

  if (entry.amount) {
    text += `\n💰 ยอดรวม: ${formatCurrency(entry.amount)}\n`;
  }

  if (entry.description) {
    text += `\nบันทึก: ${entry.description}\n`;
  }

  text += `\n— บันทึกจาก Personal Organizer`;
  return text;
};

/**
 * Share entry using Web Share API or copy to clipboard fallback
 */
export const shareEntry = async (entry: Entry): Promise<'shared' | 'copied' | 'failed'> => {
  const shareText = formatEntryShareText(entry);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: entry.title,
        text: shareText,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') return 'failed'; // User cancelled share dialog
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      return 'copied';
    }
  } catch (err) {
    console.error('Clipboard copy failed', err);
  }

  return 'failed';
};
