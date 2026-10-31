/**
 * Date Utility Functions (Timezone-Safe for Local Dates)
 */

/**
 * Returns today's date (or given date) as a string 'YYYY-MM-DD' in user's local timezone
 */
export const getTodayDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Safely parse a date string (YYYY-MM-DD or ISO) into a local Date without UTC offset shifts
 */
export const parseLocalDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  const date = parseLocalDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatShortDate = (dateStr: string | null | undefined): string => {
  const date = parseLocalDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
};

export const getDueStatus = (dueDateStr: string | null | undefined, isCompleted = false) => {
  if (!dueDateStr || isCompleted) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseLocalDate(dueDateStr);
  if (!due) return null;
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      type: 'overdue',
      label: `เลยกำหนด ${Math.abs(diffDays)} วัน`,
      days: diffDays,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    };
  } else if (diffDays === 0) {
    return {
      type: 'today',
      label: 'ครบกำหนดวันนี้',
      days: 0,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  } else if (diffDays === 1) {
    return {
      type: 'tomorrow',
      label: 'ครบกำหนดพรุ่งนี้',
      days: 1,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    };
  } else if (diffDays <= 7) {
    return {
      type: 'upcoming',
      label: `อีก ${diffDays} วัน`,
      days: diffDays,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
    };
  }

  return {
    type: 'future',
    label: formatDate(dueDateStr),
    days: diffDays,
    color: 'text-slate-500 bg-slate-50 border-slate-200',
  };
};
