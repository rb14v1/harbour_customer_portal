import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, FileText, LayoutDashboard, LifeBuoy, LogOut, Package, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/tickets', label: 'Tickets', icon: LifeBuoy },
  { to: '/kb', label: 'Help Center', icon: BookOpen },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-5 py-5 text-lg font-semibold text-primary">Customer Portal</div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm', isActive ? 'bg-blue-50 font-medium text-primary' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-slate-500">{user.email}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{user.role}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="font-semibold text-primary">Customer Portal</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sign out
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 md:hidden">
          {items.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('whitespace-nowrap rounded px-3 py-1 text-sm', isActive && 'bg-blue-50 text-primary')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
