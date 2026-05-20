import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Meta Orbit Agency" }] }),
  component: () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (password.length < 8) { toast.error("Min 8 characters"); return; }
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Password updated");
      navigate({ to: "/dashboard" });
    };
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="font-display text-2xl font-bold">Set a new password</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-orbit text-primary-foreground">{loading ? "Updating…" : "Update password"}</Button>
          </form>
        </Card>
      </div>
    );
  },
});
