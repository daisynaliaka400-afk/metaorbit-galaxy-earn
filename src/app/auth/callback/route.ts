import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const plan = searchParams.get("plan") || "free";
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "User",
          username: data.user.email?.split("@")[0].toLowerCase() || "user",
          subscription_tier: plan === "free" ? "free" : plan,
          wallet_balance: 0,
          total_earned: 0,
        });
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        if (plan !== "free") {
          return NextResponse.redirect(`${origin}/payment?plan=${plan}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        if (plan !== "free") {
          return NextResponse.redirect(
            `https://${forwardedHost}/payment?plan=${plan}`
          );
        }
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        if (plan !== "free") {
          return NextResponse.redirect(`${origin}/payment?plan=${plan}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
