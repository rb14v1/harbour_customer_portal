import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, isStaff } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorAlert, QueryState } from '@/components/ui/Feedback';

export default function ArticlePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const staff = isStaff(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [voted, setVoted] = useState(null);
  const query = useQuery({ queryKey: ['kb-article', slug], queryFn: () => api.get(`/kb/articles/${slug}`).then((r) => r.data) });

  const vote = useMutation({
    mutationFn: (helpful) => api.post(`/kb/articles/${query.data._id}/vote`, { helpful }),
    onSuccess: (_, helpful) => {
      setVoted(helpful);
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/kb/articles/${query.data._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      navigate('/kb');
    },
  });

  return (
    <QueryState query={query}>
      {(a) => (
        <div className="mx-auto max-w-3xl">
          <Link to="/kb" className="text-sm text-primary hover:underline">
            ← Help Center
          </Link>
          <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{a.categoryId?.name}</p>
              <h1 className="text-2xl font-semibold">{a.title}</h1>
              <p className="mt-1 text-xs text-slate-400">
                Updated {formatDate(a.updatedAt)} · {a.views} views {staff && <Badge value={a.status} className="ml-2" />}
              </p>
            </div>
            {staff && (
              <div className="flex gap-2">
                <Link to={`/kb/edit/${a.slug}`} className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-100">
                  Edit
                </Link>
                <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => window.confirm('Delete this article?') && remove.mutate()}>
                  Delete
                </Button>
              </div>
            )}
          </div>
          <Card>
            <CardContent className="prose-kb py-6">
              {/* react-markdown does not render raw HTML, so article content cannot inject scripts. */}
              <Markdown>{a.body}</Markdown>
            </CardContent>
          </Card>
          {a.status === 'published' && (
            <Card className="mt-6">
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <ErrorAlert error={vote.error} />
                {voted === null ? (
                  <>
                    <span className="text-sm font-medium">Was this article helpful?</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => vote.mutate(true)} disabled={vote.isPending}>
                        <ThumbsUp className="h-4 w-4" /> Yes
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => vote.mutate(false)} disabled={vote.isPending}>
                        <ThumbsDown className="h-4 w-4" /> No
                      </Button>
                    </div>
                  </>
                ) : voted ? (
                  <span className="text-sm text-green-700">Thanks for your feedback!</span>
                ) : (
                  <span className="text-sm">
                    Sorry this didn't help.{' '}
                    {!staff && (
                      <Link to="/tickets/new" className="text-primary hover:underline">
                        Open a support ticket
                      </Link>
                    )}
                  </span>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </QueryState>
  );
}
