import React from 'react';
import {
  CheckSquare,
  ShoppingCart,
  Wallet,
  FileText,
  Target,
  Bell,
  Folder,
  Bookmark,
  Calendar,
  Clock,
  Heart,
  Star,
  Tag,
  Book,
  Code,
  Coffee,
  Compass,
  CreditCard,
  Gift,
  Home,
  Lightbulb,
  Music,
  Smile,
  Zap,
  LucideIcon,
} from 'lucide-react';

export const AVAILABLE_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'check-square', label: 'To-do', icon: CheckSquare },
  { name: 'shopping-cart', label: 'Shopping', icon: ShoppingCart },
  { name: 'wallet', label: 'Expense', icon: Wallet },
  { name: 'file-text', label: 'Notes', icon: FileText },
  { name: 'target', label: 'Goals', icon: Target },
  { name: 'bell', label: 'Reminders', icon: Bell },
  { name: 'folder', label: 'Folder', icon: Folder },
  { name: 'bookmark', label: 'Bookmark', icon: Bookmark },
  { name: 'calendar', label: 'Calendar', icon: Calendar },
  { name: 'clock', label: 'Clock', icon: Clock },
  { name: 'heart', label: 'Heart', icon: Heart },
  { name: 'star', label: 'Star', icon: Star },
  { name: 'tag', label: 'Tag', icon: Tag },
  { name: 'book', label: 'Book', icon: Book },
  { name: 'code', label: 'Code', icon: Code },
  { name: 'coffee', label: 'Coffee', icon: Coffee },
  { name: 'compass', label: 'Compass', icon: Compass },
  { name: 'credit-card', label: 'Card', icon: CreditCard },
  { name: 'gift', label: 'Gift', icon: Gift },
  { name: 'home', label: 'Home', icon: Home },
  { name: 'lightbulb', label: 'Idea', icon: Lightbulb },
  { name: 'music', label: 'Music', icon: Music },
  { name: 'smile', label: 'Smile', icon: Smile },
  { name: 'zap', label: 'Energy', icon: Zap },
];

export const AVAILABLE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
  '#84CC16', // Lime
];

export const renderCategoryIcon = (iconName?: string | null, className = 'w-5 h-5') => {
  const match = AVAILABLE_ICONS.find((i) => i.name === iconName);
  const IconComponent = match ? match.icon : Folder;
  return <IconComponent className={className} />;
};
