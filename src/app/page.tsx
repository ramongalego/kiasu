import { Button, Container } from "@/components/ui";
import { BookOpen, Share2, CheckSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const features = [
  {
    icon: BookOpen,
    title: "Organize Your Studies",
    description:
      "Create structured study lists to keep track of everything you need to learn.",
  },
  {
    icon: CheckSquare,
    title: "Track Progress",
    description: "Mark items as completed and see your progress at a glance.",
  },
  {
    icon: Share2,
    title: "Share with Others",
    description:
      "Make your lists public and share your curated study resources.",
  },
  {
    icon: Users,
    title: "Learn Together",
    description:
      "Discover study lists from the community and learn from others.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      {/* Hero */}
      <section className="py-32 sm:py-44">
        <Container className="text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Study smarter,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              not harder
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-muted-foreground">
            Kiasu helps you create, organize, and share study lists so you never
            miss a thing. Stay ahead of the curve.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/20"
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

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/50 p-6 text-center transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
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

      {/* CTA */}
      <section className="border-t border-border/50 py-24">
        <Container className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light text-muted-foreground">
            Join Kiasu today and take control of your learning. It&apos;s free.
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/20"
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
