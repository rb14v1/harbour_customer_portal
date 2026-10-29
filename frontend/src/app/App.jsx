import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AppLayout from '@/app/layouts/AppLayout';
import LoginPage from '@/features/auth/LoginPage';
import { ForgotPasswordPage, ResetPasswordPage } from '@/features/auth/PasswordPages';
import DashboardPage from '@/features/dashboard/DashboardPage';
import OrdersPage from '@/features/orders/OrdersPage';
import OrderDetailPage from '@/features/orders/OrderDetailPage';
import InvoicesPage from '@/features/invoices/InvoicesPage';
import InvoiceDetailPage from '@/features/invoices/InvoiceDetailPage';
import TicketsPage from '@/features/tickets/TicketsPage';
import NewTicketPage from '@/features/tickets/NewTicketPage';
import TicketDetailPage from '@/features/tickets/TicketDetailPage';
import KbPage from '@/features/kb/KbPage';
import ArticlePage from '@/features/kb/ArticlePage';
import ArticleEditorPage from '@/features/kb/ArticleEditorPage';
import UsersPage from '@/features/admin/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="kb" element={<KbPage />} />
          <Route path="kb/:slug" element={<ArticlePage />} />

          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="tickets/new" element={<NewTicketPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['agent', 'admin']} />}>
            <Route path="kb/new" element={<ArticleEditorPage />} />
            <Route path="kb/edit/:slug" element={<ArticleEditorPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
