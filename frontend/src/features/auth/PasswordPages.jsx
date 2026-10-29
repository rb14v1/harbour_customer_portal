import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { ErrorAlert } from '@/components/ui/Feedback';

function Shell({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 py-8">
          <h1 className="text-xl font-semibold">{title}</h1>
          {children}
          <Link to="/login" className="block text-center text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email') })) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/forgot', values);
      setMessage(data.message);
    } catch (err) {
      setError(err);
    }
  });

  return (
    <Shell title="Reset password">
      {message ? (
        <p className="text-sm text-green-700">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ErrorAlert error={error} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            <FieldError error={formState.errors.email} />
          </div>
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </Shell>
  );
}

const resetSchema = z
  .object({ password: z.string().min(8, 'At least 8 characters'), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(resetSchema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await api.post('/auth/reset', { token: params.get('token'), password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err);
    }
  });

  return (
    <Shell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ErrorAlert error={error} />
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          <FieldError error={formState.errors.password} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
          <FieldError error={formState.errors.confirm} />
        </div>
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </Shell>
  );
}
