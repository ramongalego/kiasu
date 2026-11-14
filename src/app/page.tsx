import type { Metadata } from 'next';
import { Button, Container } from '@/components/ui';
import { BookOpen, Share2, CheckSquare, Compass, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FREE_TIER_LIMITS, PREMIUM_LIFETIME_PRICE } from '@/lib/tier-limits';

const DESCRIPTION =
  'Build learning paths from any resource, track your progress item by item, and share them publicly on Kiasu. Free to start.';

export const metadata: Metadata = {
  title: 'Kiasu · Organize and Share Learning Paths',
  description: DESCRIPTION,
  openGraph: {
    title: 'Kiasu · Organize and Share Learning Paths',
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    title: 'Kiasu · Organize and Share Learning Paths',
    description: DESCRIPTION,
  },
};

const features = [
  {
    icon: BookOpen,
    title: 'Build a learning path',
    description:
      'Add articles, videos and courses in the order you’ll work through them.',
  },
  {
    icon: CheckSquare,
    title: 'Track progress',
    description: 'Tick off items as you finish and see what’s left.',
  },
  {
    icon: Share2,
    title: 'Share a path',
    description: 'Make a path public and send anyone the link.',
  },
  {
    icon: Compass,
    title: 'Browse other paths',
    description:
      'Find public paths in Discovery, vote on them and save copies to your dashboard.',
  },
];

const FREE_TIER = [
  `Up to ${FREE_TIER_LIMITS.studyLists} learning paths`,
  `Up to ${FREE_TIER_LIMITS.privateStudyLists} private paths`,
  'Track progress on every item',
  'Share paths publicly',
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
          'Build learning paths from any resource, track your progress item by item, and share them publicly on Kiasu.',
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
      <section className="py-20 sm:py-32 lg:py-40">
        <Container className="text-center">
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
            Organize your{' '}
            <span className="whitespace-nowrap text-primary">
              learning paths
            </span>{' '}
            and study resources
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Collect articles, videos, courses, and any resource into structured
            lists. Track what you&apos;ve finished, see what&apos;s left, and
            share your paths with other learners.
          </p>
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/signup">
              <Button size="lg">Get started for free</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free to use. Premium is a one-time {PREMIUM_LIFETIME_PRICE}.
          </p>
        </Container>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <Container>
          <h2 className="text-balance text-center text-3xl font-bold sm:text-4xl">
            A learning path for each thing you want to learn
          </h2>

          <div className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="border-t border-border/50 pt-5"
              >
                <h3 className="flex items-center gap-2 font-semibold">
                  <feature.icon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-primary"
                  />
                  {feature.title}
                </h3>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">
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
            Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Start for free. Pay once if you want more.
          </p>

          <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-xl border border-border/50 p-6">
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
            <div className="flex flex-col rounded-xl border-2 border-primary/40 bg-primary/5 p-6">
              <p className="text-xl font-bold">Premium</p>
              <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold tracking-tight">
                <span>{PREMIUM_LIFETIME_PRICE}</span>
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
                <Link href="/signup">
                  <Button className="w-full">Get Premium</Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 py-24">
        <Container className="text-center">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">
            Start your first learning path
          </h2>
          <div className="mt-10">
            <Link href="/signup">
              <Button size="lg">Create a free account</Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
