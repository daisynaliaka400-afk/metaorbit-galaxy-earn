import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PACKAGES } from "@/lib/packages";
import { formatCurrency } from "@/lib/utils";

export default async function ChoosePackagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/choose-package");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status, package_id, role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/dashboard");
  }

  if (profile?.account_status === "active") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen galaxy-bg px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
            Choose your package
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Pick the plan that unlocks your account.
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Complete payment inside the app and activate your MetaOrbit dashboard
            instantly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {PACKAGES.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:border-indigo-400/40 hover:bg-white/10 ${
                plan.popular ? "ring-2 ring-indigo-500/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
                </div>
                {plan.popular && (
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Best value
                  </span>
                )}
              </div>
              <div className="mb-6">
                <div className="text-4xl font-extrabold text-white">
                  {formatCurrency(plan.price)}
                </div>
                <p className="text-gray-400">One-time activation</p>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/payment?plan=${plan.id}`}
                className="block rounded-2xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
              >
                Activate {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
