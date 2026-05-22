import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WithdrawPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/withdraw");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status, role, wallet_balance, package_id")
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
          <h1 className="text-3xl font-bold">Withdraw</h1>
          <p className="mt-2 text-gray-300">Request a payout once your account is active.</p>
        </div>
        <div className="rounded-3xl bg-slate-950/80 p-6">
          <p className="text-gray-300">Withdrawals are handled automatically once your balance is available.</p>
          <p className="mt-4 text-white">For now, payout requests are processed manually by the operations team.</p>
        </div>
      </div>
    </main>
  );
}
