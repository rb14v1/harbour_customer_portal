import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Paperclip } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime, isStaff } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Label, Select, Textarea } from '@/components/ui/Input';
import { ErrorAlert, PageHeader, QueryState } from '@/components/ui/Feedback';

async function openAttachment(ticketId, att) {
  try {
    const res = await api.get(`/tickets/${ticketId}/attachments/${att.filename}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.originalName;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(errorMessage(err));
  }
}

function Message({ ticketId, message }) {
  const staffAuthor = message.authorId?.role !== 'customer';
  return (
    <div className={cn('rounded-lg border p-4', message.internal ? 'border-amber-200 bg-amber-50' : staffAuthor ? 'border-blue-100 bg-blue-50/50' : 'border-slate-200 bg-white')}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">
          {message.authorId?.name}
          {staffAuthor && <span className="ml-2 text-xs font-normal text-slate-500">Support</span>}
          {message.internal && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-700">
              <Lock className="h-3 w-3" /> Internal note
            </span>
          )}
        </span>
        <span className="text-xs text-slate-400">{formatDateTime(message.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{message.body}</p>
      {message.attachments?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.attachments.map((att) => (
            <button
              key={att.filename}
              type="button"
              onClick={() => openAttachment(ticketId, att)}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
            >
              <Paperclip className="h-3 w-3" /> {att.originalName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReplyForm({ ticketId, staff, onDone }) {
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const fileRef = useRef(null);

  const send = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append('body', body);
      form.append('internal', String(internal));
      for (const f of fileRef.current?.files || []) form.append('attachments', f);
      return api.post(`/tickets/${ticketId}/messages`, form);
    },
    onSuccess: () => {
      setBody('');
      setInternal(false);
      if (fileRef.current) fileRef.current.value = '';
      onDone();
    },
  });

  return (
    <Card>
      <CardContent className="space-y-3">
        <ErrorAlert error={send.error} />
        <Label htmlFor="reply">{internal ? 'Internal note (only visible to support)' : 'Reply'}</Label>
        <Textarea id="reply" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={internal ? 'border-amber-300 bg-amber-50' : ''} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <input ref={fileRef} type="file" multiple accept=".png,.jpg,.jpeg,.pdf" className="text-xs" aria-label="Attachments" />
            {staff && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note
              </label>
            )}
          </div>
          <Button onClick={() => send.mutate()} disabled={!body.trim() || send.isPending}>
            {send.isPending ? 'Sending…' : internal ? 'Add note' : 'Send reply'}
          </Button>
        </div>
        <p className="text-xs text-slate-400">PNG, JPG or PDF · up to 5 MB each</p>
      </CardContent>
    </Card>
  );
}

function StaffControls({ ticket, onChange, pending }) {
  const agents = useQuery({ queryKey: ['agents'], queryFn: () => api.get('/users/agents').then((r) => r.data), staleTime: 5 * 60_000 });
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" value={ticket.status} disabled={pending} onChange={(e) => onChange({ status: e.target.value })}>
          {['open', 'pending', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select id="priority" value={ticket.priority} disabled={pending} onChange={(e) => onChange({ priority: e.target.value })}>
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="assignee">Assignee</Label>
        <Select id="assignee" value={ticket.assignee?._id || ''} disabled={pending} onChange={(e) => onChange({ assignee: e.target.value || null })}>
          <option value="">Unassigned</option>
          {agents.data?.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const staff = isStaff(user);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['ticket', id], queryFn: () => api.get(`/tickets/${id}`).then((r) => r.data) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
  };
  const update = useMutation({ mutationFn: (changes) => api.patch(`/tickets/${id}`, changes), onSuccess: refresh });

  return (
    <QueryState query={query}>
      {(t) => (
        <>
          <PageHeader title={`#${t.number} · ${t.subject}`} description={`${t.customerId?.name} · opened by ${t.createdBy?.name} on ${formatDateTime(t.createdAt)}`} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {t.messages.map((m) => (
                <Message key={m._id} ticketId={t._id} message={m} />
              ))}
              {t.status !== 'closed' ? (
                <ReplyForm ticketId={t._id} staff={staff} onDone={refresh} />
              ) : (
                <p className="text-sm text-slate-500">This ticket is closed.{!staff && ' Reopen it to add a reply.'}</p>
              )}
            </div>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <ErrorAlert error={update.error} />
                {staff ? (
                  <StaffControls ticket={t} onChange={(c) => update.mutate(c)} pending={update.isPending} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <Badge value={t.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Priority</span>
                      <Badge value={t.priority} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned to</span>
                      <span>{t.assignee?.name || 'Support team'}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="capitalize">{t.category}</span>
                </div>
                {t.orderId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order</span>
                    <Link to={`/orders/${t.orderId._id}`} className="text-primary hover:underline">
                      {t.orderId.number}
                    </Link>
                  </div>
                )}
                {!staff &&
                  (t.status === 'closed' ? (
                    <Button variant="outline" className="w-full" onClick={() => update.mutate({ status: 'open' })} disabled={update.isPending}>
                      Reopen ticket
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => update.mutate({ status: 'closed' })} disabled={update.isPending}>
                      Close ticket
                    </Button>
                  ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </QueryState>
  );
}
