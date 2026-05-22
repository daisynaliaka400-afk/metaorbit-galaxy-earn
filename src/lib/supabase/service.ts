import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in environment"
  );
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

const DEFAULT_ADMIN_EMAIL = "admin@metaorbit.com";
const DEFAULT_ADMIN_PASSWORD = "Admin@12345";

export async function ensureDefaultAdminUser() {
  try {
    const { data: existingRole } = await supabaseAdmin
      .from("roles")
      .select("slug")
      .eq("slug", "admin")
      .single();

    if (!existingRole) {
      await supabaseAdmin.from("roles").insert([
        { slug: "user", label: "User" },
        { slug: "admin", label: "Administrator" },
      ]);
    }
  } catch {
    // Ignore if roles table is not available yet.
  }

  try {
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", DEFAULT_ADMIN_EMAIL)
      .single();

    if (existingProfile?.user_id) {
      return;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      user_metadata: {
        full_name: "Admin",
      },
      email_confirm: true,
    });

    if (error || !data?.user) {
      return;
    }

    const userId = data.user.id;

    await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      full_name: "Admin",
      email: DEFAULT_ADMIN_EMAIL,
      username: "admin",
      role: "admin",
      account_status: "active",
      payment_status: "paid",
      package_id: "vip",
      package_name: "VIP",
      activated_at: new Date().toISOString(),
      wallet_balance: 0,
      total_earned: 0,
    });

    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });
  } catch {
    // Fail silently if admin setup cannot run yet.
  }
}
