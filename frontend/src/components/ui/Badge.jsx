import { cn } from '@/lib/utils';

const colors = {
  // orders
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-200 text-slate-700',
  // invoices
  unpaid: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  // tickets
  open: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-slate-200 text-slate-700',
  // priority
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-sky-100 text-sky-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
  // kb
  draft: 'bg-slate-200 text-slate-700',
  published: 'bg-green-100 text-green-800',
};

export function Badge({ value, className, children }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', colors[value] || 'bg-slate-100 text-slate-700', className)}>
      {children ?? value}
    </span>
  );
}
