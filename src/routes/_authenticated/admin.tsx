import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wallet, ListChecks, Coins, ShieldCheck } from "lucide-react";
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

  const setWithdrawalStatus = async (id: string, status: "completed" | "rejected") => {
    const { error } = await supabase.from("withdrawals").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Withdrawal ${status}`); stats.refetch(); }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, payments and withdrawals</p>
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
                  <Button size="sm" onClick={() => setWithdrawalStatus(w.id, "completed")}>Approve</Button>
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
                <Badge variant={u.status === "active" ? "default" : "secondary"}>{u.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
