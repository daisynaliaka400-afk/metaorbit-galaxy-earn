import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // First try to get session from storage (faster)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Double-check with getUser if no session (handles edge cases)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw redirect({ to: "/login", search: { redirect: location.href } as any });
      }
    }
  },
  component: () => <Outlet />,
});
