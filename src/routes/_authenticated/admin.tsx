import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Wallet, ListChecks, Coins, ShieldCheck, Plus, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Admin Panel — Meta Orbit Agency" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, payments, withdrawals, tasks] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "completed"),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("task_history").select("*", { count: "exact", head: true }),
      ]);
      const revenue = (payments.data ?? []).reduce((s, p: any) => s + Number(p.amount || 0), 0);
      return {
        userCount: users.count ?? 0,
        revenue,
        withdrawals: withdrawals.data ?? [],
        taskCount: tasks.count ?? 0,
      };
    },
  });

  const recentUsers = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, username, status, balance, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const tasksList = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("id,title,type,reward,is_active").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setWithdrawalStatus = async (id: string, status: "paid" | "rejected") => {
    const { error } = await supabase.from("withdrawals").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Withdrawal ${status}`); stats.refetch(); }
  };

  const activateUser = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("User activated"); recentUsers.refetch(); }
  };

  // Add task form state
  const [newTask, setNewTask] = useState({
    title: "", description: "", type: "video", category: "General",
    reward: 15, content_url: "", thumbnail_url: "",
  });
  const [creating, setCreating] = useState(false);

  const createTask = async () => {
    if (!newTask.title || !newTask.content_url) {
      toast.error("Title and content URL are required");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description,
      type: newTask.type as any,
      category: newTask.category,
      reward: newTask.reward,
      content_url: newTask.content_url,
      thumbnail_url: newTask.thumbnail_url || null,
      is_active: true,
    });
    setCreating(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Task created and live");
      setNewTask({ title: "", description: "", type: "video", category: "General", reward: 15, content_url: "", thumbnail_url: "" });
      tasksList.refetch();
    }
  };

  const toggleTask = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("tasks").update({ is_active: !is_active }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(!is_active ? "Task activated" : "Task disabled"); tasksList.refetch(); }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, tasks, payments and withdrawals</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat Icon={Users} label="Total users" value={String(stats.data?.userCount ?? "—")} />
        <Stat Icon={Coins} label="Revenue" value={`KES ${(stats.data?.revenue ?? 0).toFixed(2)}`} />
        <Stat Icon={Wallet} label="Withdrawal requests" value={String(stats.data?.withdrawals.length ?? 0)} />
        <Stat Icon={ListChecks} label="Tasks completed" value={String(stats.data?.taskCount ?? 0)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pending withdrawals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(stats.data?.withdrawals ?? []).filter((w: any) => w.status === "pending").length === 0 && (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            )}
            {(stats.data?.withdrawals ?? []).filter((w: any) => w.status === "pending").map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">KES {Number(w.amount).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{w.phone}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setWithdrawalStatus(w.id, "paid")}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => setWithdrawalStatus(w.id, "rejected")}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent users</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(recentUsers.data ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.username}</div>
                  <div className="text-xs text-muted-foreground">KES {Number(u.balance).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.status === "active" ? "default" : "secondary"}>{u.status}</Badge>
                  {u.status !== "active" && (
                    <Button size="sm" variant="outline" onClick={() => activateUser(u.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" />Activate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add task */}
      <Card className="mt-8">
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add new task</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reward (KES)</Label>
            <Input type="number" value={newTask.reward} onChange={(e) => setNewTask({ ...newTask, reward: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>Content URL</Label>
            <Input value={newTask.content_url} onChange={(e) => setNewTask({ ...newTask, content_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail URL (optional)</Label>
            <Input value={newTask.thumbnail_url} onChange={(e) => setNewTask({ ...newTask, thumbnail_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <Button onClick={createTask} disabled={creating} className="bg-gradient-orbit text-primary-foreground shadow-glow">
              {creating ? "Creating…" : "Create task"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manage tasks */}
      <Card className="mt-6">
        <CardHeader><CardTitle>All tasks ({tasksList.data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(tasksList.data ?? []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="min-w-0">
                <div className="truncate font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.type} · KES {Number(t.reward).toFixed(0)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Live" : "Disabled"}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleTask(t.id, t.is_active)}>
                  {t.is_active ? "Disable" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <Card className="bg-gradient-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
        <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
