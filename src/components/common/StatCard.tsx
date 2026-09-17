import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'default' | 'red' | 'emerald' | 'amber' | 'blue';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'default',
}) => {
  const colorMap = {
    default: 'bg-white border-slate-200 text-slate-900',
    red: 'bg-white border-red-200 text-red-700',
    emerald: 'bg-white border-emerald-200 text-emerald-700',
    amber: 'bg-white border-amber-200 text-amber-700',
    blue: 'bg-white border-blue-200 text-blue-700',
  };

  const iconBgMap = {
    default: 'bg-slate-100 text-slate-700',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-xs card-hover ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && <p className="mt-1 text-xs font-medium text-emerald-600">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBgMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
