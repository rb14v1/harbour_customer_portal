import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { ErrorAlert } from '@/components/ui/Feedback';
import { useAuth } from './AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await login(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-8">
          <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
          <p className="mb-6 text-sm text-slate-500">Customer Portal</p>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <ErrorAlert error={error} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              <FieldError error={formState.errors.email} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              <FieldError error={formState.errors.password} />
            </div>
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <Link to="/forgot-password" className="block text-center text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
