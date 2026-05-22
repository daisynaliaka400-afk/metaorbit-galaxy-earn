import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, username, role, package_id, package_name, account_status, payment_status, wallet_balance, total_earned")
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
          <h1 className="text-3xl font-bold">Account Profile</h1>
          <p className="mt-2 text-gray-300">View your core account settings and active package.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-4">Profile details</h2>
            <dl className="space-y-4 text-sm text-gray-300">
              <div>
                <dt className="font-medium text-white">Name</dt>
                <dd>{profile.full_name || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Email</dt>
                <dd>{profile.email || user.email || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Username</dt>
                <dd>{profile.username || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Role</dt>
                <dd>{profile.role || "user"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-4">Subscription</h2>
            <dl className="space-y-4 text-sm text-gray-300">
              <div>
                <dt className="font-medium text-white">Package</dt>
                <dd>{profile.package_name || "Not selected"}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Status</dt>
                <dd>{profile.account_status || "inactive"}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Payment</dt>
                <dd>{profile.payment_status || "unpaid"}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Wallet balance</dt>
                <dd>{formatCurrency(profile.wallet_balance || 0)}</dd>
              </div>
              <div>
                <dt className="font-medium text-white">Total earned</dt>
                <dd>{formatCurrency(profile.total_earned || 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
