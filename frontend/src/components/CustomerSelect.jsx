import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Select } from '@/components/ui/Input';

export function CustomerSelect({ value, onChange }) {
  const { data } = useQuery({ queryKey: ['customers'], queryFn: () => api.get('/customers?limit=100').then((r) => r.data.data), staleTime: 5 * 60_000 });
  return (
    <Select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-56" aria-label="Customer">
      <option value="">All customers</option>
      {data?.map((c) => (
        <option key={c._id} value={c._id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
