import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Coins, Globe, Image as ImageIcon, FileText, Play, Sparkles, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meta Orbit Agency — Earn rewards by completing simple tasks" },
      { name: "description", content: "Join Meta Orbit Agency. Watch videos, read articles, view images, and visit websites to earn rewards. Activate your package and start today." },
      { property: "og:title", content: "Meta Orbit Agency — Earn rewards online" },
      { property: "og:description", content: "Earn by completing simple online tasks. Pick a package and start today." },
    ],
  }),
  component: Index,
});

const filters = [
  { id: "all", label: "All Tasks", Icon: Sparkles },
  { id: "video", label: "Videos", Icon: Play },
  { id: "article", label: "Articles", Icon: FileText },
  { id: "image", label: "Images", Icon: ImageIcon },
  { id: "website", label: "Websites", Icon: Globe },
] as const;

function Index() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["public-tasks"],
    queryFn: async (): Promise<TaskCardData[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,description,type,category,thumbnail_url,reward")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data as TaskCardData[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  const visible = (tasks ?? []).filter((t) => filter === "all" || t.type === filter);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="absolute right-[-10%] top-[-20%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-3xl animate-orbit-pulse" aria-hidden />
        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 backdrop-blur">
              <Sparkles className="mr-1.5 h-3 w-3" />Welcome to Meta Orbit Agency
            </Badge>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Earn rewards by completing <span className="text-gradient-orbit">simple online tasks</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              Watch videos, read articles, browse images, and visit websites. Pick a package, activate your account, and start earning today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-orbit text-primary-foreground shadow-glow hover:opacity-90">
                <Link to="/signup">Get started free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 text-left sm:gap-8">
              {[
                { Icon: Coins, label: "Earn per task", value: "KES 12–30" },
                { Icon: Users, label: "Referral bonuses", value: "Unlimited" },
                { Icon: Wallet, label: "Withdraw from", value: "KES 500" },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <div className="font-display text-xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tasks feed */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Live task feed</h2>
            <p className="mt-1 text-muted-foreground">Browse a sample of what you'll earn from once your account is active.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  filter === f.id
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <f.Icon className="h-3.5 w-3.5" />{f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((t) => (
              <TaskCard key={t.id} task={t} requireAuth={false} />
            ))}
          </div>
        )}

        <div className="mt-12 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-card p-8 text-center shadow-glow sm:p-12">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Ready to start earning?</h3>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">Create your free account, pick a package, and unlock unlimited tasks.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-orbit text-primary-foreground shadow-glow"><Link to="/signup">Create account</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Meta Orbit Agency · All rights reserved
      </footer>
    </div>
  );
}
