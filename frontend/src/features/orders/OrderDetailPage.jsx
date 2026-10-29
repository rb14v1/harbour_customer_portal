import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Th } from '@/components/ui/Table';
import { PageHeader, QueryState } from '@/components/ui/Feedback';

export default function OrderDetailPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['order', id], queryFn: () => api.get(`/orders/${id}`).then((r) => r.data) });

  return (
    <QueryState query={query}>
      {(order) => (
        <>
          <PageHeader
            title={`Order ${order.number}`}
            description={`${order.customerId?.name} · placed ${formatDate(order.placedAt)}`}
            actions={
              <Link to={`/tickets/new?orderId=${order._id}`} className="text-sm text-primary hover:underline">
                Problem with this order?
              </Link>
            }
          />
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Badge value={order.status} />
            </CardHeader>
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Product</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Unit price</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.sku}>
                    <Td className="font-mono text-xs">{item.sku}</Td>
                    <Td>{item.name}</Td>
                    <Td className="text-right">{item.qty}</Td>
                    <Td className="text-right">{formatMoney(item.unitPrice)}</Td>
                    <Td className="text-right">{formatMoney(item.qty * item.unitPrice)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <CardContent className="ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                {formatMoney(order.subtotal)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                {formatMoney(order.tax)}
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                {formatMoney(order.total)}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </QueryState>
  );
}
