import React from 'react';
import { StockStatus, InvoiceStatus, PaymentStatus } from '../../types/database.types';

interface StatusBadgeProps {
  status: StockStatus | InvoiceStatus | PaymentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    // Stock Status
    case 'IN_STOCK':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'IN STOCK';
      break;
    case 'BOOKED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'BOOKED';
      break;
    case 'SOLD':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      label = 'SOLD';
      break;
    case 'DELIVERED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'DELIVERED';
      break;

    // Invoice Status
    case 'DRAFT':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      label = 'DRAFT';
      break;
    case 'FINALIZED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      label = 'FINALIZED';
      break;
    case 'CANCELLED':
      colorClasses = 'bg-red-50 text-red-700 border-red-200';
      label = 'CANCELLED';
      break;

    // Payment Status
    case 'PAID':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'PAID';
      break;
    case 'PARTIALLY_PAID':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'PARTIALLY PAID';
      break;
    case 'UNPAID':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'UNPAID';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wider uppercase font-semibold ${sizeClasses} ${colorClasses}`}
    >
      {label}
    </span>
  );
};
