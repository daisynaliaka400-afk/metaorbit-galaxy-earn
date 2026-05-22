-- ============ SUPABASE AUTHENTICATION SETUP SQL ============
-- Run this in Supabase SQL Editor to set up username/password authentication

-- ============ ADD PASSWORD HASH AND USERNAME TO PROFILES ============
-- Add password_hash field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';

-- Add username field (already exists but ensure it's unique)
-- Note: username should already exist from previous migrations

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));

-- ============ CREATE DEFAULT ADMIN ACCOUNT ============
-- Default admin credentials: username: admin, password: admin123
-- Password hash for "admin123" using SHA-256: 0c49b89f3221066eda64e1e9a6d7b47b6adc2557753e91386575e373a375c782

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
  full_name,
  created_at,
  updated_at
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
  'Admin User',
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'admin',
  NOW()
) ON CONFLICT (user_id, role) DO NOTHING;

-- ============ UPDATE EXISTING USERS TO HAVE PASSWORD HASHES ============
-- This updates existing users to have default passwords
-- You may want to customize this based on your existing data

-- Update a few example users with default passwords
-- Password hash for "password123": ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

UPDATE public.profiles 
SET 
  password_hash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
  updated_at = NOW()
WHERE username = 'testuser' OR username = 'demo';

-- ============ CREATE SAMPLE USERS FOR TESTING ============
-- Create some test users for development

-- Test user 1: username: john_doe, password: password123
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
  full_name,
  created_at,
  updated_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'john_doe',
  'john@example.com',
  '+254711234567',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- SHA-256 hash of "password123"
  'active',
  0,
  'USER0001',
  'John Doe',
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Test user 2: username: jane_smith, password: password123
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
  full_name,
  created_at,
  updated_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  'jane_smith',
  'jane@example.com',
  '+254722345678',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- SHA-256 hash of "password123"
  'active',
  0,
  'USER0002',
  'Jane Smith',
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Assign user role to test users
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at
) VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'user', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'user', NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- ============ ENABLE PUBLIC LOGIN ACCESS ============
-- Supabase Row Level Security is likely enabled on profiles and user_roles.
-- The app performs anonymous username/password lookups during login,
-- so we must allow SELECT by anon for login checks.
CREATE POLICY IF NOT EXISTS profiles_public_login ON public.profiles
  FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS user_roles_public_read ON public.user_roles
  FOR SELECT TO anon
  USING (true);

-- If registration is done directly from the browser, allow anon inserts into profiles
CREATE POLICY IF NOT EXISTS profiles_public_insert ON public.profiles
  FOR INSERT TO anon
  WITH CHECK (true);

-- ============ VERIFY SETUP ============
-- Check that admin user was created
SELECT username, email, status FROM public.profiles WHERE username = 'admin';

-- Check that test users were created
SELECT username, email, status FROM public.profiles WHERE username IN ('john_doe', 'jane_smith');

-- Check user roles
SELECT u.username, r.role 
FROM public.profiles u
JOIN public.user_roles r ON u.id = r.user_id
WHERE u.username IN ('admin', 'john_doe', 'jane_smith');

-- ============ USAGE INSTRUCTIONS ============
-- 1. Copy this SQL and run it in Supabase SQL Editor
-- 2. Test login with these credentials:
--    - Admin: username: admin, password: admin123
--    - Test User 1: username: john_doe, password: password123
--    - Test User 2: username: jane_smith, password: password123
-- 3. For production, change default passwords and add proper user management

-- = SECURITY NOTES = =
-- - SHA-256 is not the most secure hashing algorithm for production
-- - Consider using bcrypt or Argon2 for better security
-- - This is for development/testing purposes only
-- - In production, implement proper password reset functionality