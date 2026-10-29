import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50';

export const Input = forwardRef(({ className, ...props }, ref) => <input ref={ref} className={cn(field, 'h-9', className)} {...props} />);
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-[100px]', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(field, 'h-9 py-1', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export function Label({ className, ...props }) {
  return <label className={cn('mb-1 block text-sm font-medium text-slate-700', className)} {...props} />;
}

export function FieldError({ error }) {
  return error ? <p className="mt-1 text-xs text-red-600">{error.message}</p> : null;
}
