export type EntryStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type EntryPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurringInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface EntryItem {
  id?: number;
  entry_id?: number;
  title: string;
  amount?: number | null;
  quantity?: number | null;
  is_completed?: boolean;
  sort_order?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  entry_count?: number;
  pending_count?: number;
}

export interface Entry {
  id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  entry_date: string;
  due_date: string | null;
  status: EntryStatus;
  priority: EntryPriority;
  amount: number | null;
  quantity: number | null;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  recurring?: RecurringInterval;
  items?: EntryItem[];
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface EntryFilters {
  search?: string;
  category_id?: string | number;
  status?: string;
  priority?: string;
  is_favorite?: boolean | string;
  is_archived?: boolean | string;
  start_date?: string;
  end_date?: string;
  due_status?: 'all' | 'overdue' | 'today' | 'upcoming';
  sort_by?: 'entry_date' | 'due_date' | 'created_at' | 'priority' | 'title' | 'amount';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ExpenseByCategory {
  category_name: string;
  category_color: string;
  category_icon: string;
  entry_count: number;
  total_amount: number;
}

export interface DashboardSummaryData {
  summary: {
    total_entries: number;
    active_entries: number;
    pending_entries: number;
    in_progress_entries: number;
    completed_entries: number;
    favorite_entries: number;
    archived_entries: number;
    total_expense_amount: number;
  };
  expenseByCategory: ExpenseByCategory[];
  upcomingDue: Entry[];
  overdue: Entry[];
  recentEntries: Entry[];
  categories: Category[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
