import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PACKAGES, PAYNECTA_BASE_URL } from "@/lib/packages";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const planId = body?.planId;

  if (!planId) {
    return NextResponse.json({ error: "Package is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const plan = PACKAGES.find((item) => item.id === planId);
  if (!plan) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const { origin } = new URL(request.url);
  const paymentReference = crypto.randomUUID();
  const payUrl = new URL(PAYNECTA_BASE_URL);
  payUrl.searchParams.set("amount", plan.price.toString());
  payUrl.searchParams.set("reference", paymentReference);
  payUrl.searchParams.set("email", user.email ?? "");
  payUrl.searchParams.set("package", plan.id);
  payUrl.searchParams.set("package_name", plan.name);
  payUrl.searchParams.set("callback_url", `${origin}/api/payment/status?ref=${paymentReference}`);

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("pay_reference, status")
    .eq("user_id", user.id)
    .eq("package_id", plan.id)
    .maybeSingle();

  if (existingPayment && existingPayment.status === "paid") {
    return NextResponse.json({
      paymentReference: existingPayment.pay_reference,
      payUrl: payUrl.toString(),
      alreadyPaid: true,
    });
  }

  await supabase.from("payments").upsert(
    {
      user_id: user.id,
      package_id: plan.id,
      package_name: plan.name,
      amount: plan.price,
      currency: "KES",
      pay_reference: paymentReference,
      status: "pending",
      metadata: {
        email: user.email,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "pay_reference",
    }
  );

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email,
      package_id: plan.id,
      package_name: plan.name,
      account_status: "pending",
      payment_status: "pending",
      role: "user",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  return NextResponse.json({ paymentReference, payUrl: payUrl.toString() });
}
