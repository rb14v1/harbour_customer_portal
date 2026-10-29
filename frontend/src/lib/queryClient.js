import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, err) => count < 2 && ![401, 403, 404].includes(err?.response?.status),
      refetchOnWindowFocus: false,
    },
  },
});
