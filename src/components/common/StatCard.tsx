import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  actionButton?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconBgColor = 'bg-slate-100',
  iconColor = 'text-slate-700',
  actionButton
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg ${iconBgColor} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>

      {actionButton && <div className="mt-4 pt-3 border-t border-slate-100">{actionButton}</div>}
    </div>
  );
};
