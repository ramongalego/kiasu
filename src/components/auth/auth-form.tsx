'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import { SocialLoginButtons } from './social-login-buttons';
import { loginSchema, signupSchema } from '@/lib/validations/schemas';
import {
  checkUsernameAvailability,
  resolveUsernameToEmail,
} from '@/app/auth/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === 'login';
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Username availability state (signup only)
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.length >= 3) {
      setUsernameStatus('checking');
    } else {
      setUsernameStatus('idle');
    }
  };

  useEffect(() => {
    if (isLogin || username.length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username);
        if (result.error) {
          setUsernameStatus('idle');
          setErrors((prev) => ({ ...prev, username: result.error! }));
        } else {
          setUsernameStatus(result.available ? 'available' : 'taken');
          setErrors((prev) => {
            const next = { ...prev };
            delete next.username;
            return next;
          });
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, isLogin]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isLogin) {
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
      router.push('/dashboard');
      router.refresh();
      setLoading(false);
    } else {
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
      router.push('/dashboard');
      router.refresh();
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `mt-1 block w-full rounded-xl border ${errors[field] ? 'border-destructive' : 'border-border/50'} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? 'Sign in to continue to Kiasu'
              : 'Get started with Kiasu for free'}
          </p>
        </div>

        <SocialLoginButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
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
          ) : (
            <>
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
                  <p className="mt-1 text-xs text-destructive">
                    {errors.email}
                  </p>
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
                  onChange={(e) => handleUsernameChange(e.target.value)}
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
                {errors.username && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.username}
                  </p>
                )}
              </div>
            </>
          )}
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
            {loading
              ? isLogin
                ? 'Signing in...'
                : 'Creating account...'
              : isLogin
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={isLogin ? '/signup' : '/login'}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </Card>
    </div>
  );
}
