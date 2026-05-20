import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
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
          <Button variant="outline" asChild><Link to="/dashboard">Dashboard</Link></Button>
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
        <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  },
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { profile } = useAuth();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    if (task.content_url) window.open(task.content_url, "_blank", "noopener,noreferrer");
    setSecondsLeft(task.min_duration_seconds ?? 15);
  };

  const claim = async () => {
    if (!task) return;
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
    return <div className="container mx-auto px-4 py-16"><div className="h-72 animate-pulse rounded-xl bg-muted/40" /></div>;
  }
  if (error || !task) return null;

  const inactive = profile?.status !== "active";
  const ready = secondsLeft !== null && secondsLeft <= 0;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Link></Button>

      <Card className="overflow-hidden border-border/60 bg-gradient-card">
        {task.thumbnail_url && (
          <div className="aspect-video overflow-hidden bg-muted">
            <img src={task.thumbnail_url} alt={task.title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{task.category}</Badge>
            <Badge className="gap-1 bg-gradient-orbit text-primary-foreground">
              <Coins className="h-3 w-3" />KES {Number(task.reward).toFixed(0)}
            </Badge>
          </div>
          <CardTitle className="mt-2 text-2xl">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground">{task.description}</p>

          {inactive && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
              <div>
                Your account isn't active yet. <Link to="/choose-package" className="underline">Activate a package</Link> to earn from tasks.
              </div>
            </div>
          )}

          {alreadyDone || done ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              You've already completed this task.
            </div>
          ) : secondsLeft === null ? (
            <Button onClick={startTask} disabled={inactive} className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
              <ExternalLink className="mr-1.5 h-4 w-4" />Start task
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
        </CardContent>
      </Card>
    </div>
  );
}
