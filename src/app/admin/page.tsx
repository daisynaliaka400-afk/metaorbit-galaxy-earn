import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen galaxy-bg px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-4">Admin Panel</h1>
        <p className="text-gray-300 mb-8">
          This area is restricted to administrators only. Manage users, packages, and payments from here.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-3">Users</h2>
            <p className="text-gray-300">View and manage registered accounts.</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-3">Payments</h2>
            <p className="text-gray-300">Monitor webhook payments and account activations.</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold mb-3">Packages</h2>
            <p className="text-gray-300">Update package pricing and availability here.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
