import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Table({ className, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  );
}

export const Th = ({ className, ...props }) => <th className={cn('border-b border-slate-200 px-4 py-2 font-medium text-slate-500', className)} {...props} />;
export const Td = ({ className, ...props }) => <td className={cn('border-b border-slate-100 px-4 py-3', className)} {...props} />;

export function Pagination({ page, limit, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500">
      <span>
        {total} result{total === 1 ? '' : 's'} · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, children = 'Nothing here yet.' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-400">
        {children}
      </td>
    </tr>
  );
}
