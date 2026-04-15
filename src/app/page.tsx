import type { Metadata } from 'next';
import { Button, Container } from '@/components/ui';
import { BookOpen, Share2, CheckSquare, Users, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kiasu \u00b7 Organize and Share Learning Paths',
  description:
    'Build learning paths from any resource, track your progress step by step, and share curated study lists with a community of learners. Free to start.',
  openGraph: {
    title: 'Kiasu \u00b7 Organize and Share Learning Paths',
    description:
      'Build learning paths from any resource, track your progress step by step, and share curated study lists with a community of learners. Free to start.',
    type: 'website',
  },
  twitter: {
    title: 'Kiasu \u00b7 Organize and Share Learning Paths',
    description:
      'Build learning paths from any resource, track your progress step by step, and share curated study lists with a community of learners. Free to start.',
  },
};

const features = [
  {
    icon: BookOpen,
    title: 'Organize Your Studies',
    description:
      'Create structured learning paths to keep track of everything you need to learn.',
  },
  {
    icon: CheckSquare,
    title: 'Track Progress',
    description: 'Mark items as completed and see your progress at a glance.',
  },
  {
    icon: Share2,
    title: 'Share with Others',
    description:
      'Make your lists public and share your curated study resources.',
  },
  {
    icon: Users,
    title: 'Learn Together',
    description:
      'Discover learning paths from the community and learn from others.',
  },
];

const FREE_TIER = [
  'Up to 5 learning paths',
  'Up to 2 private paths',
  'Track progress on every item',
  'Share lists publicly',
  'Browse community learning paths',
];

const PREMIUM_TIER = [
  'Unlimited learning paths',
  'Unlimited private paths',
  'Boosted Discovery ranking',
  'Priority support',
  'All future features included',
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Kiasu',
        url: 'https://www.kiasu.co',
        logo: 'https://www.kiasu.co/android-chrome-512x512.png',
      },
      {
        '@type': 'WebSite',
        name: 'Kiasu',
        url: 'https://www.kiasu.co',
        description:
          'Build learning paths from any resource, track your progress step by step, and share curated study lists with a community of learners.',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-44">
        {/* Aurora — three soft blurred blobs echoing the indigo→violet gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-3xl dark:bg-indigo-500/20" />
          <div className="absolute top-10 -right-24 h-[460px] w-[460px] animate-[heroGlow_9s_ease-in-out_infinite] rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/15" />
          <div className="absolute bottom-[-180px] left-1/3 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-400/10" />
        </div>

        <Container className="relative text-center">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
            Organize your{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              learning paths
            </span>{' '}
            <br />
            and{' '}
            <span className="relative inline-block">
              <span
                aria-hidden="true"
                className="absolute inset-x-[-0.15em] top-[0.15em] bottom-[0.1em] z-0 -rotate-[1.5deg] rounded-[0.15em] bg-indigo-400/35 dark:bg-indigo-400/30"
              />
              <span className="relative z-10">study resources</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-muted-foreground">
            Collect articles, videos, courses, and any resource into structured
            lists. Track what you&apos;ve finished, see what&apos;s left, and
            share your paths with other learners.
          </p>
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/20 transition-all hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
              >
                Get started for free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No subscription. Premium access from $9.99.
          </p>
        </Container>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <Container>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Everything you need to stay on track
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-light text-muted-foreground">
            Simple tools to help you organize your learning journey.
          </p>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border/50 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-[0_10px_30px_-12px_rgba(99,102,241,0.25)]"
              >
                <span className="absolute top-4 right-4 font-mono text-xs text-muted-foreground/50">
                  0{i + 1}
                </span>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm font-light text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="border-t border-border/50 py-24">
        <Container>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            No subscription, no surprises
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-light text-muted-foreground">
            Start for free. Pay once if you want more.
          </p>

          <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-border/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-lg">
              <p className="text-xl font-bold">Free</p>
              <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold tracking-tight">
                <span>$0</span>
                <span className="text-base font-normal text-muted-foreground">
                  forever
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No credit card needed
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {FREE_TIER.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Premium */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_20px_50px_-20px_rgba(99,102,241,0.4)]">
              {/* Subtle dot pattern in the top-right corner */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.22)_1px,transparent_1px)] bg-[length:24px_24px] [mask-image:radial-gradient(ellipse_80%_60%_at_100%_0%,black_10%,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_80%_60%_at_100%_0%,black_10%,transparent_70%)]"
              />
              <p className="text-xl font-bold">Premium</p>
              <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold tracking-tight">
                <span>$9.99</span>
                <span className="text-base font-normal text-muted-foreground">
                  one-time
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pay once, keep it forever
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {PREMIUM_TIER.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href="/upgrade">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-violet-600 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]">
                    Upgrade for $9.99
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA — aurora bookend to the hero */}
      <section className="relative overflow-hidden border-t border-border/50 py-24">
        {/* Aurora blobs — mirrored/inverted from the hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -right-24 -bottom-20 h-[360px] w-[360px] rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/15" />
          <div className="absolute -bottom-10 -left-24 h-[380px] w-[380px] animate-[heroGlow_9s_ease-in-out_infinite] rounded-full bg-violet-500/18 blur-3xl dark:bg-violet-500/12" />
        </div>

        <Container className="relative text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to{' '}
            <span className="relative inline-block">
              <span
                aria-hidden="true"
                className="absolute inset-x-[-0.15em] top-[0.15em] bottom-[0.1em] z-0 -rotate-[1.5deg] rounded-[0.15em] bg-indigo-400/35 dark:bg-indigo-400/30"
              />
              <span className="relative z-10">get started</span>
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light text-muted-foreground">
            Free to start. One-off upgrade if you want more. No recurring fees,
            no gimmicks.
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-violet-600 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
              >
                Create your account
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
