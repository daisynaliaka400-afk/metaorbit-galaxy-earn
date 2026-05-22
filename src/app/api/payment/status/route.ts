import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentReference = url.searchParams.get("ref");

  if (!paymentReference) {
    return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("status, package_id, package_name, amount")
    .eq("pay_reference", paymentReference)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: payment.status,
    packageId: payment.package_id,
    packageName: payment.package_name,
    amount: payment.amount,
  });
}
