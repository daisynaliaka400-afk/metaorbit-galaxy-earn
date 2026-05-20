import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { MetaOrbitWordmark } from "@/components/MetaOrbitLogo";

export const Route = createFileRoute("/payment-success")({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || "",
    status: (s.status as string) || "",
  }),
  head: () => ({ meta: [{ title: "Payment Status — Meta Orbit Agency" }] }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { reference, status: urlStatus } = Route.useSearch();
  const { session, profile, refresh } = useAuth();
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 30; // Poll for up to 60 seconds (30 * 2s)

  // Poll for payment status
  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment-status", reference, pollCount],
    enabled: !!reference,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if payment is completed/failed or we've polled enough
      if (data?.status === "completed" || data?.status === "failed" || pollCount >= maxPolls) {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, status, amount, package_id, user_id")
        .eq("reference", reference)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Increment poll count
  useEffect(() => {
    if (payment?.status === "pending" && pollCount < maxPolls) {
      const t = setTimeout(() => setPollCount((c) => c + 1), 2000);
      return () => clearTimeout(t);
    }
  }, [payment?.status, pollCount]);

  // Refresh auth profile when payment completes
  useEffect(() => {
    if (payment?.status === "completed") {
      refresh();
    }
  }, [payment?.status, refresh]);

  // Check if the profile is now active
  const isActive = profile?.status === "active";
  const paymentCompleted = payment?.status === "completed";
  const paymentFailed = payment?.status === "failed";
  const paymentPending = !payment || payment?.status === "pending";
  const timedOut = paymentPending && pollCount >= maxPolls;

  // Auto-redirect to dashboard after successful activation
  useEffect(() => {
    if (paymentCompleted && isActive) {
      const t = setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [paymentCompleted, isActive, navigate]);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <Card className="relative w-full max-w-md border-border/60 bg-card/80 p-8 backdrop-blur shadow-card text-center">
        <div className="mb-6 flex justify-center">
          <MetaOrbitWordmark />
        </div>

        {paymentCompleted && isActive ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-emerald-500">
              Payment Successful!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your account has been activated. You can now start earning from tasks.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Redirecting to dashboard in 3 seconds...
            </p>
            <Button
              asChild
              className="mt-6 w-full bg-gradient-orbit text-primary-foreground shadow-glow"
            >
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : paymentFailed ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-red-500">
              Payment Failed
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your payment could not be processed. Please try again.
            </p>
            <Button
              asChild
              className="mt-6 w-full bg-gradient-orbit text-primary-foreground shadow-glow"
            >
              <Link to="/choose-package">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        ) : timedOut ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
              <Loader2 className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              Payment Processing
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your payment is still being processed. This may take a few minutes.
              Please check your dashboard for updates.
            </p>
            <Button
              asChild
              className="mt-6 w-full bg-gradient-orbit text-primary-foreground shadow-glow"
            >
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              Verifying Payment
            </h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Reference: {reference || "N/A"}
            </p>
          </>
        )}

        {!session && (paymentCompleted || paymentFailed || timedOut) && (
          <div className="mt-6 pt-6 border-t border-border/60">
            <p className="text-sm text-muted-foreground mb-3">
              Please sign in to access your account
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
