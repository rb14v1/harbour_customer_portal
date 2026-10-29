import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatMoney, isStaff } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, QueryState } from '@/components/ui/Feedback';

function CustomerDashboard({ data }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Amount due" value={formatMoney(data.amountDue)} />
        <StatCard label="Unpaid invoices" value={data.unpaidInvoices} />
        <StatCard label="Overdue invoices" value={data.overdueInvoices} />
        <StatCard label="Open tickets" value={data.openTickets} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link to="/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {data.recentOrders.length === 0 && <p className="px-5 py-6 text-sm text-slate-400">No orders yet.</p>}
            {data.recentOrders.map((o) => (
              <Link key={o._id} to={`/orders/${o._id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50">
                <span className="font-medium">{o.number}</span>
                <span className="text-slate-500">{formatDate(o.placedAt)}</span>
                <Badge value={o.status} />
                <span>{formatMoney(o.total)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-slate-600">Most questions are answered in our Help Center — search it first for an instant answer.</p>
            <Link to="/kb" className="flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white font-medium hover:bg-slate-100">
              Search Help Center
            </Link>
            <Link to="/tickets/new" className="block text-center text-primary hover:underline">
              Or open a support ticket
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StaffDashboard({ data, role }) {
  const s = data.ticketsByStatus;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open tickets" value={(s.open || 0) + (s.pending || 0)} hint={`${s.open || 0} open · ${s.pending || 0} pending`} />
        <StatCard label="Assigned to me" value={data.assignedToMe} />
        <StatCard label="Unassigned" value={data.unassigned} />
        <StatCard label="Avg. resolution" value={data.avgResolutionHours != null ? `${data.avgResolutionHours} h` : '—'} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tickets (last 30 days)" value={data.ticketsLast30Days} />
        <StatCard label="KB deflection rate" value={`${data.kb.deflectionRate}%`} hint="Helpful KB votes vs. new tickets" />
        <StatCard label="KB article views" value={data.kb.views.toLocaleString()} />
        {role === 'admin' && <StatCard label="Overdue invoices" value={data.overdueInvoices} />}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Open tickets by priority</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {['urgent', 'high', 'medium', 'low'].map((p) => (
            <Link key={p} to={`/tickets?priority=${p}`} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <Badge value={p} /> <span className="font-semibold">{data.openByPriority[p] || 0}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['metrics'], queryFn: () => api.get('/metrics/summary').then((r) => r.data) });

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} description={isStaff(user) ? 'Support overview' : 'Your account at a glance'} />
      <QueryState query={query}>{(data) => (isStaff(user) ? <StaffDashboard data={data} role={user.role} /> : <CustomerDashboard data={data} />)}</QueryState>
    </>
  );
}
