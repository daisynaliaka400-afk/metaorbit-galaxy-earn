import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/service";

const WEBHOOK_SECRET = process.env.PAYNECTA_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expectedSignature, "utf8")
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paynecta-signature") || "";

  if (!WEBHOOK_SECRET || !signature || !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = payload.reference || payload.paymentReference || payload.order_reference;
  const status = (payload.status || payload.payment_status || "").toString().toLowerCase();

  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("pay_reference", reference)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  if (status !== "success" && status !== "paid") {
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("pay_reference", reference);

    return NextResponse.json({ ok: true });
  }

  const userId = payment.user_id ?? payload.user_id;
  const email = payment.metadata?.email || payload.email;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, account_status")
    .eq("user_id", userId || "")
    .maybeSingle();

  let resolvedProfile = profile;
  if (!resolvedProfile && email) {
    const { data: profileByEmail } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, account_status")
      .eq("email", email)
      .maybeSingle();
    resolvedProfile = profileByEmail;
  }

  if (!resolvedProfile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const packageName = payment.package_name || payload.package_name || payload.package;

  await supabaseAdmin.from("payments").update({
    status: "paid",
    transaction_reference: payload.transaction_reference || payload.transactionRef || payload.transaction || null,
    updated_at: new Date().toISOString(),
  }).eq("pay_reference", reference);

  await supabaseAdmin.from("profiles").update({
    account_status: "active",
    payment_status: "paid",
    activated_at: new Date().toISOString(),
    package_id: payment.package_id,
    package_name: packageName,
    pay_reference: reference,
    updated_at: new Date().toISOString(),
  }).eq("user_id", resolvedProfile.user_id || resolvedProfile.id);

  await supabaseAdmin.from("transactions").insert({
    user_id: resolvedProfile.user_id || resolvedProfile.id,
    type: "payment",
    amount: payment.amount,
    description: `Payment completed for ${packageName}`,
    status: "completed",
    pay_reference: reference,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
