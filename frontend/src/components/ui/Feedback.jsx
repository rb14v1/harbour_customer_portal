import { Loader2 } from 'lucide-react';
import { errorMessage } from '@/lib/api';

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorAlert({ error }) {
  if (!error) return null;
  return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage(error)}</div>;
}

export function QueryState({ query, children }) {
  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorAlert error={query.error} />;
  return children(query.data);
}
