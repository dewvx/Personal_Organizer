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
