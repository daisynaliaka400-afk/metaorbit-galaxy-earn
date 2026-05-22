import { createClientWithFallback as createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const session_id = searchParams.get("session_id");
  const state = searchParams.get("state");

  if (!session_id) {
    return NextResponse.redirect(`${origin}/payment?error=missing_session`);
  }

  try {
    const supabase = await createClient();
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("user_id, package, amount, pay_reference, status, created_at")
      .eq("id", session_id)
      .single();

    if (sessionError) {
      throw new Error("Session not found");
    }

    if (session.status !== "paid") {
      throw new Error("Payment not confirmed");
    }

    // Update user profile to active status
    const { error: updateError } = await supabase.from("profiles").update({
      user_id: session.user_id,
      account_status: "active",
      payment_status: "paid",
      activated_at: new Date().toISOString(),
      package: session.package,
      pay_reference: session.pay_reference,
      updated_at: new Date().toISOString(),
    }).eq("user_id", session.user_id);

    if (updateError) {
      throw new Error("Failed to update user profile");
    }

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: session.user_id,
      type: "payment",
      amount: session.amount,
      description: `Payment for ${session.package} package`,
      status: "completed",
      pay_reference: session.pay_reference,
      created_at: new Date().toISOString(),
    });

    // Set a cookie to indicate successful activation
    const cookieStore = await cookies();
    cookieStore.set("payment_success", "true", { httpOnly: true, maxAge: 60 * 60 * 24 }); // 24 hours

    // Redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`, {
      headers: {
        "Set-Cookie": cookieStore.getAll().map(cookie => cookie.toString()).join("; "),
      },
    });

  } catch (error) {
    return NextResponse.redirect(`${origin}/payment?error=activation_failed`);
  }
}