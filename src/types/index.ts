export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_balance: number;
  total_earned: number;
  subscription_tier: "free" | "starter" | "pro" | "enterprise";
  subscription_status: "active" | "inactive" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: "credit" | "debit" | "withdrawal" | "deposit";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_id: string;
  status: "active" | "inactive" | "cancelled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
  confirm_password?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}
