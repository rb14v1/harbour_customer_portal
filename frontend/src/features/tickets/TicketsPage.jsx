import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, isStaff, toSearchParams } from '@/lib/utils';
import { useListParams } from '@/lib/useListParams';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { EmptyRow, Pagination, Table, Td, Th } from '@/components/ui/Table';
import { PageHeader, QueryState } from '@/components/ui/Feedback';

export default function TicketsPage() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const [params, update] = useListParams({ limit: 20 });
  const query = useQuery({
    queryKey: ['tickets', params],
    queryFn: () => api.get(`/tickets?${toSearchParams(params)}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title={staff ? 'Ticket queue' : 'Support tickets'}
        description={staff ? 'Work through customer requests.' : 'Track your requests with our support team.'}
        actions={
          !staff && (
            <Link to="/tickets/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New ticket
            </Link>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search subject" defaultValue={params.q || ''} onChange={(e) => update({ q: e.target.value })} className="w-56" />
        <Select value={params.status || ''} onChange={(e) => update({ status: e.target.value })} className="w-36" aria-label="Status">
          <option value="">All statuses</option>
          {['open', 'pending', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={params.priority || ''} onChange={(e) => update({ priority: e.target.value })} className="w-36" aria-label="Priority">
          <option value="">All priorities</option>
          {['urgent', 'high', 'medium', 'low'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        {staff && (
          <Select value={params.assignee || ''} onChange={(e) => update({ assignee: e.target.value })} className="w-40" aria-label="Assignee">
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Unassigned</option>
          </Select>
        )}
      </div>
      <Card>
        <QueryState query={query}>
          {(data) => (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Subject</Th>
                    {staff && <Th>Customer</Th>}
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    {staff && <Th>Assignee</Th>}
                    <Th>Updated</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 && <EmptyRow colSpan={7}>No tickets found.</EmptyRow>}
                  {data.data.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <Td className="text-slate-500">{t.number}</Td>
                      <Td>
                        <Link to={`/tickets/${t._id}`} className="font-medium text-primary hover:underline">
                          {t.subject}
                        </Link>
                      </Td>
                      {staff && <Td>{t.customerId?.name}</Td>}
                      <Td>
                        <Badge value={t.status} />
                      </Td>
                      <Td>
                        <Badge value={t.priority} />
                      </Td>
                      {staff && <Td>{t.assignee?.name || <span className="text-slate-400">—</span>}</Td>}
                      <Td className="text-slate-500">{formatDateTime(t.updatedAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={data.page} limit={data.limit} total={data.total} onChange={(page) => update({ page })} />
            </>
          )}
        </QueryState>
      </Card>
    </>
  );
}
