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

export interface EntryAttachment {
  id: number;
  entry_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  url?: string;
}

export interface CategoryCustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  required?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  monthly_budget?: number | null;
  custom_schema?: CategoryCustomField[];
  current_month_spent?: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  entry_count?: number;
  pending_count?: number;
}

export interface HabitDayLog {
  date: string;
  is_completed: boolean;
}

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  target_days: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  weeklyMatrix: HabitDayLog[];
  currentStreak: number;
  completedToday: boolean;
  weeklyCompletedCount: number;
}

export type GoalStatus = 'active' | 'paused' | 'achieved' | 'cancelled';

export interface Goal {
  id: number;
  title: string;
  description?: string | null;
  target_date?: string | null;
  target_amount?: number | null;
  status: GoalStatus;
  color: string;
  icon: string;
  created_at: string;
  updated_at?: string;
  total_tasks: number;
  completed_tasks: number;
  current_amount: number;
  days_remaining?: number | null;
  task_progress: number;
  amount_progress?: number | null;
  overall_progress: number;
  is_overdue?: boolean;
}

export interface GoalFormData {
  title: string;
  description?: string;
  target_date?: string;
  target_amount?: number | '';
  status?: GoalStatus;
  color?: string;
  icon?: string;
}

export interface Entry {
  id: number;
  category_id: number | null;
  goal_id?: number | null;
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
  attachments?: EntryAttachment[];
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  goal_title?: string;
  goal_color?: string;
  goal_icon?: string;
  custom_values?: Record<string, any>;
}

export interface DashboardWidgetItem {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface EntryFilters {
  search?: string;
  category_id?: string | number;
  goal_id?: string | number;
  status?: string;
  priority?: string;
  is_favorite?: boolean | string;
  is_archived?: boolean | string;
  start_date?: string;
  end_date?: string;
  calendar_mode?: boolean | string;
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

export interface MonthlyCategoryBreakdown {
  id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  monthly_budget: number | null;
  entry_count: number;
  total_amount: number;
  budget_percent: number | null;
  percent_of_total: number;
  is_over_budget: boolean;
}

export interface MonthlyReportData {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    completionRate: number;
  };
  financials: {
    currentExpense: number;
    prevExpense: number;
    expenseDiff: number;
    expenseDiffPercent: number | null;
    categories: MonthlyCategoryBreakdown[];
  };
  habits: {
    totalLogs: number;
    completedLogs: number;
    consistencyRate: number;
  };
  goals: Goal[];
  accomplishments: {
    id: number;
    title: string;
    amount: number | null;
    entry_date: string;
    category_name: string | null;
    category_color: string | null;
  }[];
}

export interface TemplateItem {
  title: string;
  amount?: number;
  quantity?: number;
  is_completed?: boolean;
}

export interface Template {
  id: number;
  title: string;
  description: string | null;
  category_name: string | null;
  icon: string;
  color: string;
  priority: EntryPriority;
  estimated_amount: number;
  tags: string[];
  items: TemplateItem[];
  is_builtin: boolean;
  created_at: string;
}

// ----------------------------------------------------
// Expansion Phase 1: Notes, Finance, Smart Reminders
// ----------------------------------------------------

export type NoteType = 'note' | 'journal' | 'quick';
export type NoteMood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface Note {
  id: number;
  title: string;
  content: string;
  note_type: NoteType;
  mood: NoteMood | null;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  color: string;
  linked_entry_id?: number | null;
  linked_goal_id?: number | null;
  linked_entry_title?: string | null;
  linked_goal_title?: string | null;
  note_date: string;
  created_at: string;
  updated_at: string;
}

export interface NoteFilters {
  search?: string;
  note_type?: NoteType | 'all';
  mood?: NoteMood | 'all';
  is_pinned?: boolean | string;
  is_archived?: boolean | string;
  start_date?: string;
  end_date?: string;
  tag?: string;
  sort_by?: 'created_at' | 'updated_at' | 'note_date' | 'title';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface JournalCalendarDay {
  note_date: string;
  count: number;
  entries: {
    id: number;
    title: string;
    note_type: NoteType;
    mood: NoteMood | null;
    color: string;
    is_pinned: boolean;
  }[];
}

export type WalletType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'savings';

export interface Wallet {
  id: number;
  name: string;
  type: WalletType;
  balance: number;
  icon: string;
  color: string;
  is_archived: boolean;
  sort_order: number;
  transaction_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: number;
  wallet_id: number;
  category_id?: number | null;
  to_wallet_id?: number | null;
  type: TransactionType;
  amount: number;
  note?: string | null;
  tags: string[];
  transaction_date: string;
  attachment_path?: string | null;
  created_at: string;
  updated_at: string;
  wallet_name?: string;
  wallet_icon?: string;
  wallet_color?: string;
  to_wallet_name?: string;
  to_wallet_icon?: string;
  to_wallet_color?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface TransactionFilters {
  wallet_id?: number | string;
  type?: TransactionType | 'all';
  category_id?: number | string;
  start_date?: string;
  end_date?: string;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort_by?: 'transaction_date' | 'amount' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
}

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate: number;
  total_balance: number;
  counts: {
    income: number;
    expense: number;
    transfer: number;
  };
}

export interface MonthlyCategoryFinance {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  budget: number;
  total_spent: number;
  count: number;
}

export interface DailyFinanceTrend {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyFinanceReport {
  period: {
    year: number;
    month: number;
    year_month: string;
  };
  categories: MonthlyCategoryFinance[];
  daily: DailyFinanceTrend[];
}

export interface CategoryBudget {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  budget_amount: number;
  current_spent: number;
}

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  id: number;
  entry_id?: number | null;
  note_id?: number | null;
  title: string;
  message?: string | null;
  remind_at: string;
  repeat_type: ReminderRepeat;
  is_sent: boolean;
  is_snoozed: boolean;
  snooze_until?: string | null;
  created_at: string;
  updated_at: string;
  entry_title?: string | null;
  entry_due_date?: string | null;
  entry_status?: string | null;
  note_title?: string | null;
}

export interface ReminderSettings {
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  weekly_summary_enabled: boolean;
  weekly_summary_day: number;
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
