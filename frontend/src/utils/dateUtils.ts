/**
 * Date Utility Functions
 */

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatShortDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
};

export const getDueStatus = (dueDateStr: string | null | undefined, isCompleted = false) => {
  if (!dueDateStr || isCompleted) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
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
