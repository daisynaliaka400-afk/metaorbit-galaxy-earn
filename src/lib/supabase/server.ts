import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Enhance createClient to accept our custom "auth_token" cookie as a fallback
export async function createClientWithFallback() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore
          }
        },
      },
    }
  );

  // Patch auth.getUser to fallback to our auth_token cookie when Supabase user is absent
  const originalGetUser = client.auth.getUser.bind(client.auth);
  // @ts-ignore - augmenting method
  client.auth.getUser = async () => {
    const res = await originalGetUser();
    if (res?.data?.user) return res;

    const token = cookieStore.get("auth_token");
    if (token?.value) {
      // Try to locate a profile matching this token
      const { data: profile } = await client.from("profiles").select("id, username, email").eq("id", token.value).maybeSingle();
      if (profile) {
        return { data: { user: { id: String(profile.id), email: profile.email || null } }, error: null };
      }
    }

    return res;
  };

  return client;
}
