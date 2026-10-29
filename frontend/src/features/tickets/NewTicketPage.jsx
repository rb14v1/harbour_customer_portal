import { useDeferredValue, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lightbulb } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { ErrorAlert, PageHeader } from '@/components/ui/Feedback';

const schema = z.object({
  subject: z.string().trim().min(3, 'At least 3 characters').max(200),
  body: z.string().trim().min(1, 'Describe the problem'),
  category: z.enum(['billing', 'orders', 'account', 'technical', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  orderId: z.string().optional(),
});

// Surfaces KB answers while the customer types — the main ticket-deflection lever.
function KbSuggestions({ subject }) {
  const q = useDeferredValue(subject.trim());
  const { data } = useQuery({
    queryKey: ['kb-suggest', q],
    queryFn: () => api.get(`/kb/articles?limit=5&q=${encodeURIComponent(q)}`).then((r) => r.data.data),
    enabled: q.length >= 4,
    staleTime: 60_000,
  });
  if (!data?.length) return null;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="flex items-center gap-2 border-amber-100">
        <Lightbulb className="h-4 w-4 text-amber-600" />
        <CardTitle className="text-sm">These articles might answer your question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((a) => (
          <Link key={a._id} to={`/kb/${a.slug}`} target="_blank" className="block text-sm text-primary hover:underline">
            {a.title}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function NewTicketPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const { register, handleSubmit, watch, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', body: '', category: params.get('orderId') ? 'orders' : 'other', priority: 'medium', orderId: params.get('orderId') || '' },
  });
  const orders = useQuery({ queryKey: ['orders', 'picker'], queryFn: () => api.get('/orders?limit=50').then((r) => r.data.data) });

  const create = useMutation({
    mutationFn: (values) => api.post('/tickets', { ...values, orderId: values.orderId || undefined }).then((r) => r.data),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      navigate(`/tickets/${ticket._id}`);
    },
    onError: setError,
  });

  return (
    <>
      <PageHeader title="New support ticket" description="Tell us what's going on and we'll get back to you." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4" noValidate>
              <ErrorAlert error={error} />
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" {...register('subject')} />
                <FieldError error={formState.errors.subject} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select id="category" {...register('category')}>
                    {['billing', 'orders', 'account', 'technical', 'other'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select id="priority" {...register('priority')}>
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orderId">Related order</Label>
                  <Select id="orderId" {...register('orderId')}>
                    <option value="">None</option>
                    {orders.data?.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.number}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="body">Description</Label>
                <Textarea id="body" rows={7} {...register('body')} />
                <FieldError error={formState.errors.body} />
              </div>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Submitting…' : 'Submit ticket'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <KbSuggestions subject={watch('subject')} />
      </div>
    </>
  );
}
