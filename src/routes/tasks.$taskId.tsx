import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, CheckCircle2, AlertTriangle, Play, FileText, Image as ImageIcon, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks/$taskId")({
  head: () => ({ meta: [{ title: "Task — Meta Orbit Agency" }] }),
  component: TaskDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Couldn't load task</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => { router.invalidate(); reset(); }}>Retry</Button>
          <Button variant="outline" asChild><Link to="/">Home</Link></Button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => {
    const { taskId } = Route.useParams();
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Task not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Task "{taskId}" doesn't exist or was disabled.</p>
        <Button asChild className="mt-6"><Link to="/">Back to home</Link></Button>
      </div>
    );
  },
});

const typeMeta = {
  video: { label: "Watch Video", Icon: Play, tint: "from-rose-500/30 to-orange-500/20" },
  article: { label: "Read Article", Icon: FileText, tint: "from-blue-500/30 to-cyan-500/20" },
  image: { label: "View Image", Icon: ImageIcon, tint: "from-emerald-500/30 to-teal-500/20" },
  website: { label: "Visit Website", Icon: Globe, tint: "from-violet-500/30 to-fuchsia-500/20" },
};

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { session, profile } = useAuth();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,description,type,category,thumbnail_url,reward,content_url,min_duration_seconds,is_active")
        .eq("id", taskId)
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.is_active) throw notFound();
      return data;
    },
  });

  const { data: alreadyDone } = useQuery({
    queryKey: ["task-done", taskId, profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("task_history")
        .select("id")
        .eq("user_id", profile!.id)
        .eq("task_id", taskId)
        .maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    if (!task || secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [task, secondsLeft]);

  const startTask = () => {
    if (!task) return;
    setShowContent(true);
    setSecondsLeft(task.min_duration_seconds ?? 15);
  };

  const claim = async () => {
    if (!task || !session) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("complete_task", { _task_id: task.id });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`+KES ${Number(task.reward).toFixed(0)} added to your balance`);
    setDone(true);
    router.invalidate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }
  if (error || !task) return null;

  const meta = typeMeta[task.type as keyof typeof typeMeta] || typeMeta.website;
  const Icon = meta.Icon;
  const inactive = profile?.status !== "active";
  const ready = secondsLeft !== null && secondsLeft <= 0;
  const isAuthenticated = !!session;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border/60 bg-gradient-card">
            {showContent && task.content_url ? (
              <div className="relative aspect-video w-full bg-muted">
                {task.type === "image" ? (
                  <img 
                    src={task.content_url} 
                    alt={task.title} 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    src={task.content_url}
                    title={task.title}
                    className="h-full w-full"
                    sandbox="allow-scripts allow-same-origin allow-popups-to-escape-sandbox"
                    loading="lazy"
                  />
                )}
              </div>
            ) : (
              <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${meta.tint}`}>
                {task.thumbnail_url ? (
                  <img src={task.thumbnail_url} alt={task.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="h-24 w-24 text-foreground/40" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Button 
                    onClick={startTask} 
                    size="lg" 
                    className="bg-gradient-orbit text-primary-foreground shadow-glow hover:opacity-90"
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {isAuthenticated ? "Start Task" : "Preview Task"}
                  </Button>
                </div>
              </div>
            )}
            
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{task.category}</Badge>
                <Badge className="gap-1 bg-gradient-orbit text-primary-foreground">
                  <Coins className="h-3 w-3" />KES {Number(task.reward).toFixed(0)}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Icon className="h-3 w-3" />{meta.label}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-2xl">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground">{task.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Action Area */}
        <div>
          <Card className="border-border/60 bg-gradient-card sticky top-4">
            <CardContent className="p-6 space-y-4">
              {!isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-medium">Sign in required</p>
                      <p className="text-muted-foreground mt-1">Create an account and activate a package to earn from this task.</p>
                    </div>
                  </div>
                  <Button asChild className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
                    <Link to="/signup">Create Account</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
              ) : inactive ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-medium">Account not active</p>
                      <p className="text-muted-foreground mt-1">Activate a package to start earning from tasks.</p>
                    </div>
                  </div>
                  <Button asChild className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
                    <Link to="/choose-package">Choose Package</Link>
                  </Button>
                </div>
              ) : alreadyDone || done ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium">Task completed!</p>
                    <p className="text-muted-foreground">You've already earned from this task.</p>
                  </div>
                </div>
              ) : secondsLeft === null ? (
                <Button onClick={startTask} className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
                  <Icon className="mr-2 h-4 w-4" />Start Task
                </Button>
              ) : ready ? (
                <Button onClick={claim} disabled={submitting} className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
                  {submitting ? "Claiming…" : `Claim KES ${Number(task.reward).toFixed(0)}`}
                </Button>
              ) : (
                <Button disabled className="w-full">
                  Please wait {secondsLeft}s…
                </Button>
              )}

              <div className="pt-4 border-t border-border/60">
                <h4 className="font-medium text-sm mb-2">Task Details</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Reward:</span>
                    <span className="font-medium text-foreground">KES {Number(task.reward).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium text-foreground">{meta.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium text-foreground">{task.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium text-foreground">{task.min_duration_seconds ?? 15}s</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}