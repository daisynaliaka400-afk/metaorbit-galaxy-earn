import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// One-shot admin bootstrap. Hit POST once after deploy to create the seed admin.
// Idempotent: safe to call repeatedly.
export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      POST: async () => {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const email = "0112973841@metaorbit.local";
        const password = "ISINDU316711";

        const { data: existing } = await supabase.auth.admin.listUsers();
        const found = existing.users.find((u) => u.email === email);

        let userId = found?.id;
        if (!found) {
          const { data, error } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { username: "0112973841", full_name: "Meta Orbit Admin" },
          });
          if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
          userId = data.user.id;
        }

        if (userId) {
          await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
          await supabase.from("profiles").update({ status: "active" }).eq("user_id", userId);
        }

        return new Response(JSON.stringify({ ok: true, userId }), {
          status: 200, headers: { "content-type": "application/json" },
        });
      },
      GET: async () => new Response("Use POST", { status: 405 }),
    },
  },
});
