import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatMoney, isStaff, toSearchParams } from '@/lib/utils';
import { useListParams } from '@/lib/useListParams';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { EmptyRow, Pagination, Table, Td, Th } from '@/components/ui/Table';
import { PageHeader, QueryState } from '@/components/ui/Feedback';
import { CustomerSelect } from '@/components/CustomerSelect';

export default function OrdersPage() {
  const { user } = useAuth();
  const [params, update] = useListParams({ limit: 20 });
  const query = useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.get(`/orders?${toSearchParams(params)}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Orders" description="Track the status of your orders." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search order #" defaultValue={params.q || ''} onChange={(e) => update({ q: e.target.value })} className="w-48" />
        <Select value={params.status || ''} onChange={(e) => update({ status: e.target.value })} className="w-40" aria-label="Status">
          <option value="">All statuses</option>
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {isStaff(user) && <CustomerSelect value={params.customerId} onChange={(customerId) => update({ customerId })} />}
      </div>
      <Card>
        <QueryState query={query}>
          {(data) => (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Order</Th>
                    {isStaff(user) && <Th>Customer</Th>}
                    <Th>Placed</Th>
                    <Th>Items</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 && <EmptyRow colSpan={6}>No orders found.</EmptyRow>}
                  {data.data.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <Td>
                        <Link to={`/orders/${o._id}`} className="font-medium text-primary hover:underline">
                          {o.number}
                        </Link>
                      </Td>
                      {isStaff(user) && <Td>{o.customerId?.name}</Td>}
                      <Td>{formatDate(o.placedAt)}</Td>
                      <Td>{o.items.reduce((n, i) => n + i.qty, 0)}</Td>
                      <Td>
                        <Badge value={o.status} />
                      </Td>
                      <Td className="text-right">{formatMoney(o.total)}</Td>
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
