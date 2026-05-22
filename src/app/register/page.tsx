"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Star, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { registerWithUsername } from "@/lib/auth-service";
import { supabase } from "@/lib/supabase/client";
import { PACKAGES } from "@/lib/packages";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterClient />
    </Suspense>
  );
}

function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams.get("plan") || "starter";
  const selectedPlan = PACKAGES.find((p) => p.id === selectedPlanId) || PACKAGES[0];

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required.");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required.");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
const normalizedUsername = formData.username.trim().toLowerCase();

    const result = await registerWithUsername({
      username: normalizedUsername,
      phone: formData.phone.trim(),
      password: formData.password,
      referral_code: searchParams.get("ref") || undefined,
    });

    if (!result.success) {
      setError(result.error || "Registration failed");
      return;
    }

    const profileId = result.user?.id;
    if (!profileId) {
      setError("Profile not found after registration.");
      return;
    }

    await supabase.from("profiles").update({
      package_id: selectedPlan.id,
      package_activated_at: new Date().toISOString(),
      package_expires_at: new Date(
        Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: selectedPlan.id === "starter" ? "active" : "pending",
    }).eq("id", profileId);

      if (selectedPlan.id !== "starter") {
        router.push(`/payment?plan=${selectedPlan.id}`);
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen galaxy-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check your phone!</h2>
            <p className="text-gray-400 mb-6">
              We sent a verification code to <span className="text-indigo-400 font-semibold">{formData.phone}</span>.
              Follow it to finish account creation.
            </p>
            <Link
              href="/login"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen galaxy-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MetaOrbit</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-gray-400">
            Start with {selectedPlan.name} and begin earning with secure account activation.
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="john_doe"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+2547XXXXXXXX"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
