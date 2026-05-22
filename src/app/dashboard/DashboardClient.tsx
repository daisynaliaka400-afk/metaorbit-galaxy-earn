"use client";

import Link from "next/link";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ArrowRight, ChevronRight, DollarSign, Shield, Sparkles } from "lucide-react";

type Transaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
};

type Profile = {
  full_name?: string;
  email?: string;
  plan?: string;
  wallet_balance?: number;
  total_earned?: number;
  account_status?: string;
};

type DashboardClientProps = {
  user: {
    id: string;
    email?: string | null;
  };
  profile: Profile;
  transactions: Transaction[];
};

export default function DashboardClient({ user, profile, transactions }: DashboardClientProps) {
  const displayName = profile.full_name || user.email || "Member";

  return (
    <div className="min-h-screen galaxy-bg px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300 mb-3">MetaOrbit Dashboard</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Welcome back, {displayName}</h1>
            <p className="text-gray-400 max-w-2xl mt-4">
              Monitor your earnings, account status, and transaction history in one secure place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Link href="/earnings" className="glass rounded-3xl p-6 text-center hover:shadow-xl transition-shadow">
              <Sparkles className="mx-auto mb-3 w-6 h-6 text-indigo-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Earnings</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(profile.total_earned ?? 0)}</p>
            </Link>
            <Link href="/withdraw" className="glass rounded-3xl p-6 text-center hover:shadow-xl transition-shadow">
              <DollarSign className="mx-auto mb-3 w-6 h-6 text-emerald-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Balance</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(profile.wallet_balance ?? 0)}</p>
            </Link>
            <Link href="/profile" className="glass rounded-3xl p-6 text-center hover:shadow-xl transition-shadow">
              <Shield className="mx-auto mb-3 w-6 h-6 text-sky-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Status</p>
              <p className="mt-2 text-2xl font-bold text-white capitalize">{profile.account_status ?? "active"}</p>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="glass rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Recent activity</h2>
                <p className="text-gray-400 mt-2">Latest transactions and payout updates.</p>
              </div>
              <Link href="/earnings" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
                  No transactions yet. Start earning to see your first payout here.
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{transaction.description ?? "Payment"}</p>
                        <p className="text-sm text-gray-400">{formatRelativeTime(transaction.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-gray-400 capitalize">{transaction.status}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="glass rounded-3xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Account overview</h2>
              <p className="text-gray-400 mt-2">Your current plan, email, and next steps.</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Plan</p>
                <p className="mt-2 text-lg font-semibold text-white">{profile.plan ?? "Starter"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Email</p>
                <p className="mt-2 text-lg font-semibold text-white">{user.email ?? "No email"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Account</p>
                <p className="mt-2 text-lg font-semibold text-white capitalize">{profile.account_status ?? "active"}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
