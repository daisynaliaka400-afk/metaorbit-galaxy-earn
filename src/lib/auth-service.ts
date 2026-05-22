import { supabase } from "@/integrations/supabase/client";

/**
 * Simple password hashing using Web Crypto API (not production-grade)
 * For production, use bcrypt or similar on the backend
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashOfInput = await hashPassword(password);
  return hashOfInput === hash;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  phone: string;
  password: string;
  referral_code?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    phone: string;
    email?: string;
  };
}

/**
 * Login with username and password
 */
export async function loginWithUsername(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { username, password } = credentials;

    // Fetch user by username
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, username, phone, password_hash, email")
      .eq("username", username.toLowerCase())
      .single();

    if (fetchError || !profile) {
      return { success: false, error: "Invalid username or password" };
    }

    // Verify password
    const passwordValid = await verifyPassword(password, profile.password_hash);
    if (!passwordValid) {
      return { success: false, error: "Invalid username or password" };
    }

    // Store in session
    if (typeof window !== "undefined") {
      const sessionData = {
        userId: profile.id,
        username: profile.username,
        phone: profile.phone,
        email: profile.email,
        timestamp: Date.now(),
      };
      localStorage.setItem("auth_session", JSON.stringify(sessionData));
      localStorage.setItem("auth_token", profile.id); // Simple token
    }

    return {
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        phone: profile.phone,
        email: profile.email,
      },
    };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "An error occurred during login" };
  }
}

/**
 * Register with username, phone, and password
 */
export async function registerWithUsername(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    const { username, phone, password, referral_code } = credentials;

    // Check if username exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .single();

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create profile
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert([
        {
          username: username.toLowerCase(),
          phone,
          password_hash: passwordHash,
          email: `${username.toLowerCase()}@metaorbit.local`,
          status: "active",
          referral_code: referral_code?.toUpperCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id, username, phone, email")
      .single();

    if (insertError || !newProfile) {
      return { success: false, error: "Failed to create account" };
    }

    // Store in session
    if (typeof window !== "undefined") {
      const sessionData = {
        userId: newProfile.id,
        username: newProfile.username,
        phone: newProfile.phone,
        email: newProfile.email,
        timestamp: Date.now(),
      };
      localStorage.setItem("auth_session", JSON.stringify(sessionData));
      localStorage.setItem("auth_token", newProfile.id);
    }

    return {
      success: true,
      user: {
        id: newProfile.id,
        username: newProfile.username,
        phone: newProfile.phone,
        email: newProfile.email,
      },
    };
  } catch (err) {
    console.error("Register error:", err);
    return { success: false, error: "An error occurred during registration" };
  }
}

/**
 * Logout
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_session");
    localStorage.removeItem("auth_token");
  }
}

/**
 * Get current session
 */
export function getSession() {
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("auth_session");
    return session ? JSON.parse(session) : null;
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("auth_token");
  }
  return false;
}
