import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatDate, isStaff, toSearchParams } from '@/lib/utils';
import { useListParams } from '@/lib/useListParams';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Table';
import { PageHeader, QueryState } from '@/components/ui/Feedback';

export default function KbPage() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const [params, update] = useListParams({ limit: 12 });
  const categories = useQuery({ queryKey: ['kb-categories'], queryFn: () => api.get('/kb/categories').then((r) => r.data), staleTime: 10 * 60_000 });
  const articles = useQuery({
    queryKey: ['kb-articles', params],
    queryFn: () => api.get(`/kb/articles?${toSearchParams(params)}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Help Center"
        description="Find answers instantly — no waiting on a reply."
        actions={
          staff && (
            <Link to="/kb/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New article
            </Link>
          )
        }
      />
      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Search articles…" defaultValue={params.q || ''} onChange={(e) => update({ q: e.target.value })} className="pl-9" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => update({ category: '' })}
          className={cn('rounded-full border px-3 py-1 text-sm', !params.category ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 bg-white')}
        >
          All
        </button>
        {categories.data?.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => update({ category: c.slug })}
            className={cn('rounded-full border px-3 py-1 text-sm', params.category === c.slug ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 bg-white')}
          >
            {c.name}
          </button>
        ))}
        {staff && (
          <Select value={params.status || ''} onChange={(e) => update({ status: e.target.value })} className="ml-auto w-36" aria-label="Status">
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        )}
      </div>
      <QueryState query={articles}>
        {(data) => (
          <>
            {data.data.length === 0 && (
              <p className="py-10 text-center text-slate-500">
                No articles match your search.{' '}
                {!staff && (
                  <Link to="/tickets/new" className="text-primary hover:underline">
                    Open a ticket
                  </Link>
                )}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((a) => (
                <Link key={a._id} to={`/kb/${a.slug}`}>
                  <Card className="h-full transition hover:border-primary/40 hover:shadow">
                    <CardContent>
                      <p className="text-xs text-slate-500">{a.categoryId?.name}</p>
                      <h3 className="mt-1 font-medium">{a.title}</h3>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        {staff && <Badge value={a.status} />}
                        <span>Updated {formatDate(a.updatedAt)}</span>
                        <span>· {a.helpful} found helpful</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <Pagination page={data.page} limit={data.limit} total={data.total} onChange={(page) => update({ page })} />
          </>
        )}
      </QueryState>
    </>
  );
}
