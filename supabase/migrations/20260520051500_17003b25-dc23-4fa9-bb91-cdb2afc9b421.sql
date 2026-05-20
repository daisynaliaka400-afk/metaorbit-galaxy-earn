
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.account_status AS ENUM ('inactive', 'active', 'suspended');
CREATE TYPE public.task_type AS ENUM ('video', 'article', 'image', 'website');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- ============ UTILITY ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE code text;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
  END LOOP;
  RETURN code;
END; $$;

-- ============ PACKAGES ============
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price numeric(10,2) NOT NULL,
  duration_days integer NOT NULL,
  daily_task_limit integer NOT NULL DEFAULT 7,
  max_earnings numeric(10,2),
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  full_name text,
  phone text,
  status public.account_status NOT NULL DEFAULT 'inactive',
  balance numeric(12,2) NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  package_activated_at timestamptz,
  package_expires_at timestamptz,
  daily_tasks_completed integer NOT NULL DEFAULT 0,
  daily_reset_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type public.task_type NOT NULL,
  category text NOT NULL,
  thumbnail_url text,
  content_url text NOT NULL,
  reward numeric(10,2) NOT NULL,
  min_duration_seconds integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TASK HISTORY ============
CREATE TABLE public.task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reward numeric(10,2) NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_task_history_user ON public.task_history(user_id, completed_at DESC);

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.packages(id),
  amount numeric(10,2) NOT NULL,
  phone text,
  transaction_id text UNIQUE,
  reference text NOT NULL UNIQUE,
  status public.payment_status NOT NULL DEFAULT 'pending',
  payment_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_payments_user ON public.payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ============ REFERRALS ============
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  qualified boolean NOT NULL DEFAULT false,
  qualified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ============ WITHDRAWALS ============
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  phone text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_withdrawals_updated BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PAYMENT CALLBACKS (audit) ============
CREATE TABLE public.payment_callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  transaction_id text,
  raw_payload jsonb NOT NULL,
  signature_valid boolean NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_callbacks ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- packages: public read; admin write
CREATE POLICY "packages_public_read" ON public.packages FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "packages_admin_all" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles: self read/update; admin all; public can read minimal (no)
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles: self read; admin manage
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- tasks: public read active; admin all
CREATE POLICY "tasks_public_read" ON public.tasks FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tasks_admin_all" ON public.tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- task_history: self read; admin all (inserts go through RPC)
CREATE POLICY "task_history_self_read" ON public.task_history FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "task_history_admin_all" ON public.task_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- payments: self read+create; admin all
CREATE POLICY "payments_self_read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments_self_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- referrals: self read (as referrer); admin all
CREATE POLICY "referrals_self_read" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "referrals_admin_all" ON public.referrals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- withdrawals: self read+create; admin all
CREATE POLICY "withdrawals_self_read" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "withdrawals_self_insert" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "withdrawals_admin_all" ON public.withdrawals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- payment_callbacks: admin only (server uses service role)
CREATE POLICY "callbacks_admin_read" ON public.payment_callbacks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ SIGNUP TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_username text;
  v_referral_code text;
  v_referrer_id uuid;
  v_referred_code text;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_referred_code := NEW.raw_user_meta_data->>'referral_code';
  v_referral_code := public.generate_referral_code();

  IF v_referred_code IS NOT NULL AND v_referred_code <> '' THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = upper(v_referred_code);
  END IF;

  INSERT INTO public.profiles (user_id, username, full_name, phone, referral_code, referred_by)
  VALUES (
    NEW.id,
    v_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    v_referral_code,
    v_referrer_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, (SELECT id FROM public.profiles WHERE user_id = NEW.id));
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TASK COMPLETION RPC ============
CREATE OR REPLACE FUNCTION public.complete_task(_task_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_task public.tasks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_limit integer := 7;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_profile.status <> 'active' THEN RAISE EXCEPTION 'Account not active'; END IF;
  SELECT * INTO v_task FROM public.tasks WHERE id = _task_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not available'; END IF;

  IF v_profile.daily_reset_date < v_today THEN
    UPDATE public.profiles SET daily_tasks_completed = 0, daily_reset_date = v_today WHERE id = v_profile.id;
    v_profile.daily_tasks_completed := 0;
  END IF;

  IF v_profile.package_id IS NOT NULL THEN
    SELECT daily_task_limit INTO v_limit FROM public.packages WHERE id = v_profile.package_id;
  END IF;

  IF v_profile.daily_tasks_completed >= v_limit THEN
    RAISE EXCEPTION 'Daily task limit reached';
  END IF;

  IF EXISTS (SELECT 1 FROM public.task_history WHERE user_id = v_user_id AND task_id = _task_id) THEN
    RAISE EXCEPTION 'Task already completed';
  END IF;

  INSERT INTO public.task_history (user_id, task_id, reward) VALUES (v_user_id, _task_id, v_task.reward);
  UPDATE public.profiles SET
    balance = balance + v_task.reward,
    daily_tasks_completed = daily_tasks_completed + 1,
    daily_reset_date = v_today
  WHERE id = v_profile.id;

  RETURN jsonb_build_object('success', true, 'reward', v_task.reward, 'tasks_remaining', v_limit - v_profile.daily_tasks_completed - 1);
END; $$;

-- ============ WITHDRAWAL REQUEST RPC ============
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_ref_count integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_profile.status <> 'active' THEN RAISE EXCEPTION 'Account not active'; END IF;

  SELECT count(*) INTO v_ref_count FROM public.referrals r
    JOIN public.profiles p ON p.id = r.referred_id
    WHERE r.referrer_id = v_profile.id AND r.qualified = true AND p.status = 'active';

  IF v_ref_count < 10 THEN RAISE EXCEPTION 'You need at least 10 qualified referrals before withdrawing'; END IF;
  IF _amount < 500 THEN RAISE EXCEPTION 'Minimum withdrawal amount is 500'; END IF;
  IF v_profile.balance < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  INSERT INTO public.withdrawals (user_id, amount, phone) VALUES (v_user_id, _amount, _phone);
  UPDATE public.profiles SET balance = balance - _amount WHERE id = v_profile.id;
  RETURN jsonb_build_object('success', true);
END; $$;
