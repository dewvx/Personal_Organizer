import { EntryPriority, EntryStatus } from '../types';

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getStatusConfig = (status: EntryStatus) => {
  switch (status) {
    case 'completed':
      return {
        label: 'เสร็จสิ้น',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'in_progress':
      return {
        label: 'กำลังดำเนินการ',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500',
      };
    case 'cancelled':
      return {
        label: 'ยกเลิก',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
        dotClass: 'bg-slate-400',
      };
    case 'pending':
    default:
      return {
        label: 'รอดำเนินการ',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
  }
};

export const getPriorityConfig = (priority: EntryPriority) => {
  switch (priority) {
    case 'urgent':
      return {
        label: 'ด่วนมาก',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'high':
      return {
        label: 'สูง',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500',
      };
    case 'medium':
      return {
        label: 'ปานกลาง',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    case 'low':
    default:
      return {
        label: 'ต่ำ',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
};
