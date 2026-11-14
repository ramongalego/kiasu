'use client';

import { useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { FREE_TIER_LIMITS, PREMIUM_LIFETIME_PRICE } from '@/lib/tier-limits';
import { createLifetimeCheckoutSession } from '@/app/billing/actions';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  atLimit?: boolean;
}

const FREE_FEATURES = [
  `Up to ${FREE_TIER_LIMITS.studyLists} learning paths`,
  `Up to ${FREE_TIER_LIMITS.privateStudyLists} private paths`,
  'Track progress on every item',
  'Share paths publicly',
];

const PREMIUM_FEATURES = [
  'Unlimited learning paths',
  'Unlimited private paths',
  'Boosted Discovery ranking',
  'Priority support',
  'All future features included',
  'Everything in Free',
];

export function UpgradeModal({
  open,
  onClose,
  atLimit = false,
}: UpgradeModalProps) {
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl overflow-y-auto rounded-xl border border-border/50 bg-card p-4 shadow-2xl sm:p-6"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 cursor-pointer rounded-lg p-1 transition-colors duration-200 hover:bg-muted sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header copy */}
        <div className="mb-4 pr-6 text-center sm:mb-6">
          <h2 className="text-xl font-bold sm:text-2xl">Upgrade to Premium</h2>
          {atLimit ? (
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ve reached a free plan limit. Free accounts get{' '}
              {FREE_TIER_LIMITS.studyLists} learning paths,{' '}
              {FREE_TIER_LIMITS.privateStudyLists} of them private. Premium
              removes both limits.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Premium removes the learning path limits. One payment, no
              subscription.
            </p>
          )}
        </div>

        {/* Tier cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="order-2 flex flex-col rounded-xl border border-border/50 bg-muted/20 p-5 sm:order-1">
            <div className="mb-4">
              <span className="inline-block rounded-full border border-border/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Current plan
              </span>
              <p className="mt-3 text-xl font-bold">Free</p>
              <p className="mt-1 text-3xl font-bold">
                $0
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  forever
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No credit card needed
              </p>
            </div>

            <ul className="mb-6 flex-1 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" disabled className="w-full">
              Your current plan
            </Button>
          </div>

          {/* Premium */}
          <div className="order-1 flex flex-col rounded-xl border-2 border-primary/40 bg-primary/5 p-5 sm:order-2">
            <div className="mb-4">
              <p className="text-xl font-bold sm:mt-9">Premium</p>
              <p className="mt-1 text-3xl font-bold">
                {PREMIUM_LIFETIME_PRICE}
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  one-time
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pay once, keep it forever.
              </p>
            </div>

            <ul className="mb-6 flex-1 space-y-2.5">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await createLifetimeCheckoutSession();
                  if (result?.error) toast.error(result.error);
                })
              }
            >
              {pending
                ? 'Opening checkout…'
                : `Upgrade for ${PREMIUM_LIFETIME_PRICE}`}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              One-time payment · Secure checkout via Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
