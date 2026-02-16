'use client';

import { Button, Spinner } from '@/components/ui';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '@/lib/validations/schemas';
import { useUsernameAvailability } from '@/hooks/use-username-availability';
import {
  updateUsername,
  updateEmail,
  changePassword,
} from '@/app/(app)/profile/actions';
import { X, User, Mail, Lock, Check, CircleAlert } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentUsername: string;
  currentEmail: string;
  hasPassword: boolean;
}

export function EditProfileModal({
  open,
  onClose,
  currentUsername,
  currentEmail,
  hasPassword,
}: EditProfileModalProps) {
  const router = useRouter();

  // Profile form state
  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {},
  );
  const [profilePending, startProfileTransition] = useTransition();

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [passwordPending, startPasswordTransition] = useTransition();

  // Username availability (skip when unchanged)
  const checkUsername = username !== currentUsername ? username : '';
  const { status: usernameStatus, error: usernameError } =
    useUsernameAvailability(checkUsername);

  const handleClose = useCallback(() => {
    setProfileErrors({});
    setPasswordErrors({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = updateProfileSchema.safeParse({ username, email });
    if (!result.success) {
      const flat = result.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        const msg = msgs?.[0];
        if (msg) fieldErrors[key] = msg;
      }
      setProfileErrors(fieldErrors);
      return;
    }

    if (username !== currentUsername && usernameStatus === 'taken') {
      setProfileErrors({ username: 'Username is already taken' });
      return;
    }

    setProfileErrors({});

    startProfileTransition(async () => {
      const usernameChanged = username !== currentUsername;
      const emailChanged = email !== currentEmail;

      if (usernameChanged) {
        const res = await updateUsername(username);
        if (res.error) {
          setProfileErrors((prev) => ({ ...prev, username: res.error! }));
          return;
        }
      }

      if (emailChanged) {
        const res = await updateEmail(email);
        if (res.error) {
          setProfileErrors((prev) => ({ ...prev, email: res.error! }));
          return;
        }
        toast.success('Confirmation email sent. Check your inbox.');
      }

      if (usernameChanged) {
        toast.success('Username updated');
        onClose();
        router.push(`/user/${username}`);
        router.refresh();
      } else if (emailChanged) {
        onClose();
        router.refresh();
      } else {
        onClose();
      }
    });
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = changePasswordSchema.safeParse({
      currentPassword: currentPw,
      newPassword: newPw,
    });
    if (!result.success) {
      const flat = result.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        const msg = msgs?.[0];
        if (msg) fieldErrors[key] = msg;
      }
      setPasswordErrors(fieldErrors);
      return;
    }

    setPasswordErrors({});

    startPasswordTransition(async () => {
      const res = await changePassword(currentPw, newPw);
      if (res.error) {
        setPasswordErrors({ currentPassword: res.error });
        return;
      }
      toast.success('Password updated');
      setCurrentPw('');
      setNewPw('');
      onClose();
    });
  };

  const inputClass = (hasError: boolean) =>
    `mt-1 block w-full rounded-xl border ${hasError ? 'border-destructive' : 'border-border/50'} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`;

  const profileHasChanges =
    username !== currentUsername || email !== currentEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/95 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-1.5 transition-colors duration-200 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* ── Account Info Section ──────────────────────────── */}
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Username field */}
              <div>
                <label
                  htmlFor="edit-username"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Username
                </label>
                <div className="relative">
                  <input
                    id="edit-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass(
                      !!profileErrors.username || !!usernameError,
                    )}
                    autoFocus
                  />
                  {/* Inline status indicator */}
                  {username !== currentUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && (
                        <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {usernameStatus === 'available' && (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      )}
                      {usernameStatus === 'taken' && (
                        <CircleAlert className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {username !== currentUsername &&
                  usernameStatus === 'available' && (
                    <p className="mt-1 text-xs text-green-600">
                      Username is available
                    </p>
                  )}
                {username !== currentUsername && usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-destructive">
                    Username is already taken
                  </p>
                )}
                {(profileErrors.username || usernameError) && (
                  <p className="mt-1 text-xs text-destructive">
                    {profileErrors.username || usernameError}
                  </p>
                )}
              </div>

              {/* Email field */}
              <div>
                <label
                  htmlFor="edit-email"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass(!!profileErrors.email)}
                />
                {profileErrors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {profileErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  profilePending ||
                  !profileHasChanges ||
                  (username !== currentUsername &&
                    usernameStatus === 'checking')
                }
              >
                {profilePending ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Saving...
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>

          {/* ── Password Section ─────────────────────────────── */}
          {hasPassword && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Security
                  </span>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="flex items-center gap-1.5 text-sm font-medium"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className={inputClass(!!passwordErrors.currentPassword)}
                      placeholder="Enter current password"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-destructive">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="flex items-center gap-1.5 text-sm font-medium"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className={inputClass(!!passwordErrors.newPassword)}
                      placeholder="At least 6 characters"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-destructive">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={passwordPending || (!currentPw && !newPw)}
                  >
                    {passwordPending ? (
                      <span className="flex items-center gap-2">
                        <Spinner />
                        Updating...
                      </span>
                    ) : (
                      'Update password'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
