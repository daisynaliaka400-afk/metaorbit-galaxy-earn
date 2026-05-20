INSERT INTO public.packages (name, price, duration_days, daily_task_limit, max_earnings, benefits, display_order, is_active)
VALUES
  ('Starter', 300.00, 30, 5, 2000.00, '["Access to 5 daily tasks", "Earn up to KES 2,000", "Valid for 30 days", "Basic support"]'::jsonb, 0, true);