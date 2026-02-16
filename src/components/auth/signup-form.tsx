'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, Button, Container, Skeleton } from '@/components/ui';
import { signupSchema } from '@/lib/validations/schemas';
import { useUsernameAvailability } from '@/hooks/use-username-availability';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { status: usernameStatus, error: usernameError } =
    useUsernameAvailability(username);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse({ email, username, password });
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

    if (usernameStatus === 'taken') {
      setErrors((prev) => ({
        ...prev,
        username: 'Username is already taken',
      }));
      return;
    }

    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username: result.data.username },
      },
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started with Kiasu for free
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass('email')}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass('username')}
              placeholder="cool_username"
            />
            {usernameStatus === 'checking' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Checking availability...
              </p>
            )}
            {usernameStatus === 'available' && (
              <p className="mt-1 text-xs text-green-600">
                Username is available
              </p>
            )}
            {usernameStatus === 'taken' && (
              <p className="mt-1 text-xs text-destructive">
                Username is already taken
              </p>
            )}
            {(errors.username || usernameError) && (
              <p className="mt-1 text-xs text-destructive">
                {errors.username || usernameError}
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
