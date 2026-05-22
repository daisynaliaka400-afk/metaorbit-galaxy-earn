-- ============ ADD PASSWORD HASH TO PROFILES ============
-- Add password_hash and email fields to profiles table
-- This migration enables username + password authentication

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update user_id to be optional (for custom auth)
-- Note: Make user_id nullable if not already
ALTER TABLE public.profiles
ALTER COLUMN user_id DROP NOT NULL;

-- If user_id column allows null, add check for custom auth
-- When using custom auth, user_id will be generated as the primary identifier

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============ CREATE DEFAULT ADMIN ACCOUNT ============
-- Default admin credentials: username: admin, password: admin123
-- Password hash for "admin123" (SHA-256)
INSERT INTO public.profiles (
  id,
  user_id,
  username,
  email,
  phone,
  password_hash,
  status,
  balance,
  referral_code,
  full_name
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'admin',
  'admin@metaorbit.local',
  '+254712345678',
  '0c49b89f3221066eda64e1e9a6d7b47b6adc2557753e91386575e373a375c782', -- SHA-256 hash of "admin123"
  'active',
  0,
  'ADMIN0001',
  'Admin User'
) ON CONFLICT (username) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO public.user_roles (
  user_id,
  role
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'admin'
) ON CONFLICT (user_id, role) DO NOTHING;
