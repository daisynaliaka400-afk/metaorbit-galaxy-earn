"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/stripe";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen galaxy-bg flex items-center justify-center px-4 py-12"><div className="text-white">Loading...</div></div>}>
      <PaymentClient />
    </Suspense>
  );
}

function PaymentClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan") || "starter";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === planId) || PLANS[0];

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/payment?plan=${planId}`);
        return;
      }
      setUser({ email: user.email!, id: user.id });
    };
    getUser();
  }, [planId, router]);

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          priceId: selectedPlan.priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen galaxy-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-400 mb-6">
              Welcome to the {selectedPlan.name} plan. Your account has been
              upgraded.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen galaxy-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MetaOrbit</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-400">
            You're subscribing to the{" "}
            <span className="text-indigo-400 font-semibold">
              {selectedPlan.name}
            </span>{" "}
            plan
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Plan Summary */}
          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedPlan.name} Plan
                </h3>
                <p className="text-gray-400 text-sm">
                  {selectedPlan.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">
                  ${selectedPlan.price}
                </div>
                <div className="text-gray-400 text-sm">/month</div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-gray-400 mb-3">Includes:</p>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Plan Switcher */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Change plan:</p>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/payment?plan=${plan.id}`}
                  className={`text-center py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    plan.id === planId
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {plan.name}
                  <div className="text-xs opacity-75">${plan.price}/mo</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || !user}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ${selectedPlan.price}/month
              </>
            )}
          </button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>Secured by Stripe. Cancel anytime.</span>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
