import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Th } from '@/components/ui/Table';
import { PageHeader, QueryState } from '@/components/ui/Feedback';
import { DownloadPdfButton } from './DownloadPdfButton';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['invoice', id], queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data) });

  return (
    <QueryState query={query}>
      {(inv) => (
        <>
          <PageHeader title={`Invoice ${inv.number}`} actions={<DownloadPdfButton invoice={inv} variant="default" size="default" />} />
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Status</p>
                <Badge value={inv.status} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Issued</p>
                <p className="mt-1 font-medium">{formatDate(inv.issuedAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Due</p>
                <p className="mt-1 font-medium">{formatDate(inv.dueDate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Order</p>
                {inv.orderId ? (
                  <Link to={`/orders/${inv.orderId._id}`} className="mt-1 block font-medium text-primary hover:underline">
                    {inv.orderId.number}
                  </Link>
                ) : (
                  <p className="mt-1">—</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <Table>
              <thead>
                <tr>
                  <Th>Description</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Unit price</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((l, i) => (
                  <tr key={i}>
                    <Td>{l.description}</Td>
                    <Td className="text-right">{l.qty}</Td>
                    <Td className="text-right">{formatMoney(l.unitPrice)}</Td>
                    <Td className="text-right">{formatMoney(l.qty * l.unitPrice)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <CardContent className="ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                {formatMoney(inv.subtotal)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                {formatMoney(inv.tax)}
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                {formatMoney(inv.total)}
              </div>
              {inv.paidAt && <p className="pt-2 text-xs text-green-700">Paid on {formatDate(inv.paidAt)}</p>}
            </CardContent>
          </Card>
        </>
      )}
    </QueryState>
  );
}
