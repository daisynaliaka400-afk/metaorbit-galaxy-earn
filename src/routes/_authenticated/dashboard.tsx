import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Users, ListChecks, Wallet, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (roles?.some((r) => r.role === "admin")) {
        throw redirect({ to: "/admin" });
      }
    }
  },
  head: () => ({ meta: [{ title: "Dashboard — Meta Orbit Agency" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAuth();

  const { data: refCount = 0 } = useQuery({
    queryKey: ["referral-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("referrals").select("*", { count: "exact", head: true })
        .eq("referrer_id", profile!.id).eq("qualified", true);
      return count ?? 0;
    },
  });

  if (!profile) return <div className="container py-12">Loading…</div>;

  const inactive = profile.status !== "active";
  const dailyLimit = 7;
  const remaining = Math.max(0, dailyLimit - profile.daily_tasks_completed);
  const canWithdraw = refCount >= 10 && profile.balance >= 500;
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${profile.referral_code}` : "";

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome, {profile.username}</h1>
          <p className="text-muted-foreground">Your earnings overview</p>
        </div>
        <Badge variant={inactive ? "destructive" : "default"} className={!inactive ? "bg-success text-success-foreground" : ""}>
          {profile.status.toUpperCase()}
        </Badge>
      </div>

      {inactive && (
        <Card className="mb-6 border-warning/40 bg-warning/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
              <div>
                <div className="font-semibold">Your account is not active yet</div>
                <p className="text-sm text-muted-foreground">Activate a package to start earning from tasks.</p>
              </div>
            </div>
            <Button asChild className="bg-gradient-orbit text-primary-foreground shadow-glow"><Link to="/choose-package">Choose a package</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icon={Coins} label="Balance" value={`KES ${Number(profile.balance).toFixed(2)}`} />
        <StatCard Icon={Users} label="Qualified referrals" value={String(refCount)} sub="Need 10 to withdraw" />
        <StatCard Icon={ListChecks} label="Tasks remaining today" value={`${remaining}/${dailyLimit}`} />
        <StatCard Icon={Wallet} label="Withdrawal" value={canWithdraw ? "Eligible" : "Locked"} sub={!canWithdraw ? (refCount < 10 ? "Need more referrals" : "Balance below 500") : undefined} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Your referral link</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Share this link. Referrals count once they pay and activate.</p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2.5">
              <code className="flex-1 truncate text-sm">{referralLink}</code>
              <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(referralLink); toast.success("Copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm">Your code: <span className="font-mono font-semibold">{profile.referral_code}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" disabled={inactive}><Link to="/">Browse tasks</Link></Button>
            <Button asChild variant="outline" disabled={!canWithdraw}><Link to="/choose-package">Withdraw</Link></Button>
            <Button asChild variant="outline"><Link to="/choose-package">Packages</Link></Button>
            <Button asChild variant="outline"><Link to="/dashboard">History</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ Icon, label, value, sub }: { Icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-gradient-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
        <div className="mt-2 font-display text-2xl font-bold">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
