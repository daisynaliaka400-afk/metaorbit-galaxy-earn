import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
    );
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Export the client as 'supabase' for backward compatibility
export const supabase = createClient();
