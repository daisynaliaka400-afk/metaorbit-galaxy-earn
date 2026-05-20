import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Meta Orbit Agency" }] }),
  component: () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("If the email exists, a reset link has been sent");
    };
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="font-display text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-orbit text-primary-foreground">{loading ? "Sending…" : "Send reset link"}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground"><Link to="/login" className="hover:underline">Back to login</Link></p>
        </Card>
      </div>
    );
  },
});
