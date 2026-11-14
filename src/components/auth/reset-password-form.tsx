'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fieldErrors: Record<string, string> = {};
    if (password.length < 6)
      fieldErrors.password = 'Password must be at least 6 characters';
    if (password !== confirm) fieldErrors.confirm = 'Passwords do not match';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Password updated');
    router.push('/dashboard');
    router.refresh();
  };

  const inputClass = (field: string) =>
    `mt-1 block w-full rounded-xl border ${errors[field] ? 'border-destructive' : 'border-border/50'} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`;

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use at least 6 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              New password <span className="text-destructive">*</span>
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
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium">
              Confirm password <span className="text-destructive">*</span>
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass('confirm')}
              placeholder="Repeat your password"
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
