import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

// NOTE: This is a generic HMAC-SHA256 webhook. When Paynecta's actual signature
// scheme is provided, update the verification block below.
export const Route = createFileRoute("/api/public/paynecta-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-paynecta-signature") ?? "";
        const secret = process.env.PAYNECTA_WEBHOOK_SECRET ?? "";

        let valid = false;
        try {
          const expected = createHmac("sha256", secret).update(body).digest("hex");
          valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        } catch { valid = false; }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        let payload: any = {};
        try { payload = JSON.parse(body); } catch { /* ignore */ }

        await supabase.from("payment_callbacks").insert({
          reference: payload.reference ?? null,
          transaction_id: payload.transaction_id ?? null,
          raw_payload: payload,
          signature_valid: valid,
        });

        if (!valid) return new Response("Invalid signature", { status: 401 });

        const { reference, transaction_id, status, amount, phone } = payload;
        if (!reference) return new Response("Missing reference", { status: 400 });

        const { data: payment } = await supabase.from("payments").select("*").eq("reference", reference).maybeSingle();
        if (!payment) return new Response("Unknown reference", { status: 404 });
        if (payment.status === "completed") return new Response("Already processed", { status: 200 });

        if (status === "success" || status === "completed") {
          await supabase.from("payments").update({
            status: "completed", transaction_id, phone: phone ?? payment.phone,
            payment_date: new Date().toISOString(),
          }).eq("id", payment.id);

          // Activate user
          const { data: pkg } = await supabase.from("packages").select("duration_days").eq("id", payment.package_id).single();
          const expires = new Date(Date.now() + (pkg?.duration_days ?? 30) * 86400_000).toISOString();
          await supabase.from("profiles").update({
            status: "active", package_id: payment.package_id,
            package_activated_at: new Date().toISOString(), package_expires_at: expires,
          }).eq("user_id", payment.user_id);

          // Qualify referral if any
          const { data: prof } = await supabase.from("profiles").select("id, referred_by").eq("user_id", payment.user_id).single();
          if (prof?.referred_by) {
            await supabase.from("referrals").update({ qualified: true, qualified_at: new Date().toISOString() })
              .eq("referred_id", prof.id);
          }
        } else {
          await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
