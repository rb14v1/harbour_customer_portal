import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatMoney, isStaff, toSearchParams } from '@/lib/utils';
import { useListParams } from '@/lib/useListParams';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyRow, Pagination, Table, Td, Th } from '@/components/ui/Table';
import { PageHeader, QueryState } from '@/components/ui/Feedback';
import { CustomerSelect } from '@/components/CustomerSelect';
import { DownloadPdfButton } from './DownloadPdfButton';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [params, update] = useListParams({ limit: 20 });
  const query = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => api.get(`/invoices?${toSearchParams(params)}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Invoices" description="View and download your invoices." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={params.status || ''} onChange={(e) => update({ status: e.target.value })} className="w-40" aria-label="Status">
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
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
                    <Th>Invoice</Th>
                    {isStaff(user) && <Th>Customer</Th>}
                    <Th>Issued</Th>
                    <Th>Due</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Total</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 && <EmptyRow colSpan={7}>No invoices found.</EmptyRow>}
                  {data.data.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <Td>
                        <Link to={`/invoices/${inv._id}`} className="font-medium text-primary hover:underline">
                          {inv.number}
                        </Link>
                      </Td>
                      {isStaff(user) && <Td>{inv.customerId?.name}</Td>}
                      <Td>{formatDate(inv.issuedAt)}</Td>
                      <Td>{formatDate(inv.dueDate)}</Td>
                      <Td>
                        <Badge value={inv.status} />
                      </Td>
                      <Td className="text-right">{formatMoney(inv.total)}</Td>
                      <Td className="text-right">
                        <DownloadPdfButton invoice={inv} variant="ghost" />
                      </Td>
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
