import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import LoginPage from '@/features/auth/LoginPage';
import { Badge } from '@/components/ui/Badge';
import { formatMoney, toSearchParams } from '@/lib/utils';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: null, login: vi.fn() }),
}));

function renderWithProviders(ui) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  test('shows validation errors for empty submit', async () => {
    renderWithProviders(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText('Enter a valid email')).toBeInTheDocument());
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});

describe('ui helpers', () => {
  test('Badge renders its status', () => {
    render(<Badge value="overdue" />);
    expect(screen.getByText('overdue')).toHaveClass('bg-red-100');
  });

  test('formatMoney formats USD', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
  });

  test('toSearchParams drops empty values', () => {
    expect(toSearchParams({ page: 2, q: '', status: undefined, limit: 20 })).toBe('page=2&limit=20');
  });
});
