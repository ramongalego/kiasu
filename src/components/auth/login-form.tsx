'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, Button, Container, Skeleton } from '@/components/ui';
import { loginSchema } from '@/lib/validations/schemas';
import { resolveUsernameToEmail } from '@/app/auth/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const flat = result.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        const msg = msgs?.[0];
        if (msg) fieldErrors[key] = msg;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const supabase = createClient();
    let loginEmail = identifier;

    // If identifier doesn't contain @, treat as username
    if (!identifier.includes('@')) {
      const resolved = await resolveUsernameToEmail(identifier);
      if (resolved.error || !resolved.email) {
        toast.error(resolved.error ?? 'Username not found');
        setLoading(false);
        return;
      }
      loginEmail = resolved.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setRedirecting(true);
    router.push('/dashboard');
    router.refresh();
  };

  const inputClass = (field: string) =>
    `mt-1 block w-full rounded-xl border ${errors[field] ? 'border-destructive' : 'border-border/50'} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`;

  if (redirecting) {
    return (
      <Container as="section" className="py-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </Container>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to Kiasu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium">
              Email or username <span className="text-destructive">*</span>
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputClass('identifier')}
              placeholder="you@example.com or username"
            />
            {errors.identifier && (
              <p className="mt-1 text-xs text-destructive">
                {errors.identifier}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass('password')}
              placeholder="At least 6 characters"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
