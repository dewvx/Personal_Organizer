import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../common/Card';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  bgClass,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className="flex items-center justify-between p-4 sm:p-5"
    >
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
    </Card>
  );
};
