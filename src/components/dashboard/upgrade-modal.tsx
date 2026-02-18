'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Check, Zap, Flame, Infinity } from 'lucide-react';
import { Button } from '@/components/ui';
import { FREE_TIER_LIMITS } from '@/lib/tier-limits';
import {
  createCheckoutSession,
  createLifetimeCheckoutSession,
  getLifetimePurchaseCount,
} from '@/app/billing/actions';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  atLimit?: boolean;
}

type BillingPeriod = 'monthly' | 'yearly' | 'lifetime';

const LIFETIME_LIMIT = 100;

const FREE_FEATURES = [
  `Up to ${FREE_TIER_LIMITS.studyLists} learning paths`,
  `Up to ${FREE_TIER_LIMITS.privateStudyLists} private paths`,
  'Study item tracking',
  'Public discovery',
];

const PREMIUM_FEATURES = [
  'Unlimited learning paths',
  'Unlimited private paths',
  'Boosted Discovery ranking',
  'Priority support',
  'Everything in Free',
];

const LIFETIME_FEATURES = [
  'Unlimited learning paths',
  'Unlimited private paths',
  'Boosted Discovery ranking',
  'Priority support',
  'All future features included',
  'No recurring charges — ever',
];

export function UpgradeModal({
  open,
  onClose,
  atLimit = false,
}: UpgradeModalProps) {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [pending, startTransition] = useTransition();
  const [lifetimeCount, setLifetimeCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || billing !== 'lifetime') return;
    getLifetimePurchaseCount().then(setLifetimeCount);
    const interval = setInterval(
      () => getLifetimePurchaseCount().then(setLifetimeCount),
      30_000,
    );
    return () => clearInterval(interval);
  }, [open, billing]);

  if (!open) return null;

  const spotsLeft =
    lifetimeCount !== null ? LIFETIME_LIMIT - lifetimeCount : null;
  const isSoldOut = lifetimeCount !== null && lifetimeCount >= LIFETIME_LIMIT;
  const fillPct =
    lifetimeCount !== null ? (lifetimeCount / LIFETIME_LIMIT) * 100 : 0;
  const isAlmostGone =
    lifetimeCount !== null && spotsLeft !== null && spotsLeft <= 20;

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
          className="absolute right-3 top-3 cursor-pointer rounded-lg p-1 transition-colors duration-200 hover:bg-muted sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header copy */}
        <div className="mb-4 pr-6 text-center sm:mb-6">
          <h2 className="text-xl font-bold sm:text-2xl">
            {billing === 'lifetime'
              ? 'Own It Forever'
              : 'Unlock Your Full Potential'}
          </h2>
          {billing === 'lifetime' ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Pay once.{' '}
              <span className="font-medium text-foreground">
                Get premium access forever
              </span>{' '}
              — no subscriptions, no renewals, no surprises. This deal is
              available to the first {LIFETIME_LIMIT} people only.
            </p>
          ) : atLimit ? (
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ve hit your free plan limit — and that&apos;s actually a
              great sign. You&apos;re building something real.{' '}
              <span className="font-medium text-foreground">
                Let Premium take you the rest of the way.
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re off to a great start. When you&apos;re ready to go
              further,{' '}
              <span className="font-medium text-foreground">
                Premium removes every limit so nothing slows you down.
              </span>
            </p>
          )}
        </div>

        {/* Billing toggle */}
        <div className="mb-4 flex justify-center sm:mb-6">
          <div className="flex rounded-xl border border-border/50 bg-muted/40 p-1 text-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={`cursor-pointer rounded-lg px-4 py-1.5 font-medium transition-all duration-200 ${
                billing === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`flex cursor-pointer flex-col items-center rounded-lg px-4 py-1.5 font-medium transition-all duration-200 ${
                billing === 'yearly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                Save 33%
              </span>
            </button>
            <button
              onClick={() => setBilling('lifetime')}
              className={`flex cursor-pointer flex-col items-center rounded-lg px-4 py-1.5 font-medium transition-all duration-200 ${
                billing === 'lifetime'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lifetime
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Flame className="h-2.5 w-2.5" />
                Limited
              </span>
            </button>
          </div>
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
                  / month
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Forever free, no credit card needed
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

          {/* Premium / Lifetime */}
          {billing === 'lifetime' ? (
            <div className="order-1 flex flex-col rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-5 sm:order-2">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Flame className="h-3 w-3" />
                  {LIFETIME_LIMIT} spots only — ever
                </span>
                <p className="mt-3 text-xl font-bold">Lifetime Access</p>
                <p className="mt-1 text-3xl font-bold">
                  $49.99
                  <span className="text-base font-normal text-muted-foreground">
                    {' '}
                    one-time
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No subscriptions. No renewals. Pay once, own it forever.
                </p>
              </div>

              {/* Spots counter */}
              <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Spots claimed</span>
                  <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {lifetimeCount ?? '…'} / {LIFETIME_LIMIT}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                {spotsLeft !== null && (
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      isAlmostGone
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isSoldOut
                      ? 'All spots have been claimed.'
                      : isAlmostGone
                        ? `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining — act fast.`
                        : `${spotsLeft} spots still available.`}
                  </p>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2.5">
                {LIFETIME_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600"
                disabled={pending || isSoldOut}
                onClick={() =>
                  startTransition(async () => {
                    const result = await createLifetimeCheckoutSession();
                    if (result?.error) toast.error(result.error);
                  })
                }
              >
                <Infinity className="mr-2 h-4 w-4" />
                {isSoldOut
                  ? 'Sold Out'
                  : pending
                    ? 'Redirecting…'
                    : 'Claim Your Spot'}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                One-time payment · Secure checkout via Stripe
              </p>
            </div>
          ) : (
            <div className="order-1 flex flex-col rounded-xl border-2 border-primary/40 bg-primary/5 p-5 sm:order-2">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Zap className="h-3 w-3" />
                  Most popular
                </span>
                <p className="mt-3 text-xl font-bold">Premium</p>

                {billing === 'monthly' ? (
                  <>
                    <p className="mt-1 text-3xl font-bold">
                      $2.99
                      <span className="text-base font-normal text-muted-foreground">
                        {' '}
                        / month
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Billed monthly — cancel any time
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-3xl font-bold">
                      $23.99
                      <span className="text-base font-normal text-muted-foreground">
                        {' '}
                        / year
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~$2/mo · 2 months free vs monthly
                    </p>
                  </>
                )}
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
                    const result = await createCheckoutSession(billing);
                    if (result?.error) toast.error(result.error);
                  })
                }
              >
                <Zap className="mr-2 h-4 w-4" />
                {pending ? 'Redirecting…' : 'Upgrade Now'}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Cancel any time. No hidden fees.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
