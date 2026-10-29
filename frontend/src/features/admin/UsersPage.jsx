import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { toSearchParams } from '@/lib/utils';
import { useListParams } from '@/lib/useListParams';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FieldError, Input, Label, Select } from '@/components/ui/Input';
import { EmptyRow, Pagination, Table, Td, Th } from '@/components/ui/Table';
import { ErrorAlert, PageHeader, QueryState } from '@/components/ui/Feedback';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Required'),
    email: z.string().email('Enter a valid email'),
    role: z.enum(['customer', 'agent', 'admin']),
    customerId: z.string().optional(),
    password: z.string().min(8, 'At least 8 characters'),
  })
  .refine((v) => v.role !== 'customer' || v.customerId, { message: 'Pick a company', path: ['customerId'] });

function CreateUserForm({ onDone }) {
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => api.get('/customers?limit=100').then((r) => r.data.data) });
  const { register, handleSubmit, watch, reset, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: 'customer', customerId: '', password: '' },
  });
  const create = useMutation({
    mutationFn: (v) => api.post('/users', { ...v, customerId: v.role === 'customer' ? v.customerId : undefined }),
    onSuccess: () => {
      reset();
      onDone();
    },
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add user</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="grid gap-4 sm:grid-cols-3" noValidate>
          <div className="sm:col-span-3">
            <ErrorAlert error={create.error} />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            <FieldError error={formState.errors.name} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            <FieldError error={formState.errors.email} />
          </div>
          <div>
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            <FieldError error={formState.errors.password} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" {...register('role')}>
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          {watch('role') === 'customer' && (
            <div>
              <Label htmlFor="customerId">Company</Label>
              <Select id="customerId" {...register('customerId')}>
                <option value="">Select…</option>
                {customers.data?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError error={formState.errors.customerId} />
            </div>
          )}
          <div className="flex items-end">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [params, update] = useListParams({ limit: 20 });
  const query = useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get(`/users?${toSearchParams(params)}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
  const patch = useMutation({
    mutationFn: ({ id, ...changes }) => api.patch(`/users/${id}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage customer, agent and admin accounts."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <UserPlus className="h-4 w-4" /> {showForm ? 'Close' : 'Add user'}
          </Button>
        }
      />
      {showForm && (
        <CreateUserForm
          onDone={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search name or email" defaultValue={params.q || ''} onChange={(e) => update({ q: e.target.value })} className="w-64" />
        <Select value={params.role || ''} onChange={(e) => update({ role: e.target.value })} className="w-36" aria-label="Role">
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </Select>
      </div>
      <ErrorAlert error={patch.error} />
      <Card>
        <QueryState query={query}>
          {(data) => (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Company</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 && <EmptyRow colSpan={6}>No users found.</EmptyRow>}
                  {data.data.map((u) => (
                    <tr key={u._id}>
                      <Td className="font-medium">{u.name}</Td>
                      <Td>{u.email}</Td>
                      <Td className="capitalize">{u.role}</Td>
                      <Td>{u.customerId?.name || '—'}</Td>
                      <Td>{u.isActive ? <Badge value="paid">Active</Badge> : <Badge value="closed">Inactive</Badge>}</Td>
                      <Td className="text-right">
                        {u._id !== me.id && (
                          <Button variant="outline" size="sm" disabled={patch.isPending} onClick={() => patch.mutate({ id: u._id, isActive: !u.isActive })}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
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
