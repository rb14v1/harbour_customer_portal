import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Markdown from 'react-markdown';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { ErrorAlert, PageHeader, Spinner } from '@/components/ui/Feedback';

const schema = z.object({
  title: z.string().trim().min(3, 'At least 3 characters').max(200),
  categoryId: z.string().min(1, 'Pick a category'),
  status: z.enum(['draft', 'published']),
  body: z.string().trim().min(1, 'Write something'),
});

export default function ArticleEditorPage() {
  const { slug } = useParams();
  const editing = Boolean(slug);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);

  const categories = useQuery({ queryKey: ['kb-categories'], queryFn: () => api.get('/kb/categories').then((r) => r.data) });
  const existing = useQuery({ queryKey: ['kb-article', slug], queryFn: () => api.get(`/kb/articles/${slug}`).then((r) => r.data), enabled: editing });

  const { register, handleSubmit, reset, watch, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', categoryId: '', status: 'draft', body: '' },
  });

  useEffect(() => {
    if (existing.data) {
      const { title, categoryId, status, body } = existing.data;
      reset({ title, categoryId: categoryId?._id || categoryId, status, body });
    }
  }, [existing.data, reset]);

  const save = useMutation({
    mutationFn: (values) => (editing ? api.patch(`/kb/articles/${existing.data._id}`, values) : api.post('/kb/articles', values)).then((r) => r.data),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      queryClient.removeQueries({ queryKey: ['kb-article'] });
      navigate(`/kb/${article.slug}`);
    },
  });

  if (editing && existing.isPending) return <Spinner />;

  return (
    <>
      <PageHeader title={editing ? 'Edit article' : 'New article'} />
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <ErrorAlert error={save.error || existing.error} />
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              <FieldError error={formState.errors.title} />
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select id="categoryId" {...register('categoryId')}>
                <option value="">Select…</option>
                {categories.data?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError error={formState.errors.categoryId} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register('status')}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Content (Markdown)</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? 'Edit' : 'Preview'}
            </Button>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="prose-kb min-h-[300px]">
                <Markdown>{watch('body')}</Markdown>
              </div>
            ) : (
              <Textarea rows={16} className="font-mono" aria-label="Body" {...register('body')} />
            )}
            <FieldError error={formState.errors.body} />
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save article'}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
