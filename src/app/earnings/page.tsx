import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/earnings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status, role, wallet_balance, total_earned, package_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/choose-package");
  }

  if (profile.account_status !== "active" && profile.role !== "admin") {
    redirect(`/payment?plan=${profile.package_id || "starter"}`);
  }

  return (
    <main className="min-h-screen galaxy-bg px-4 py-12 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="mt-2 text-gray-300">Check your current balance and payouts.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-4">Current balance</h2>
            <p className="text-4xl font-extrabold text-white">{formatCurrency(profile.wallet_balance || 0)}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-4">Total earned</h2>
            <p className="text-4xl font-extrabold text-white">{formatCurrency(profile.total_earned || 0)}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
