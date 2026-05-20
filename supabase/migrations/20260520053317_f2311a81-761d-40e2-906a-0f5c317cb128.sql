UPDATE public.user_roles SET role = 'admin' WHERE user_id = (SELECT user_id FROM public.profiles WHERE username = '0112973841');
INSERT INTO public.user_roles (user_id, role) SELECT user_id, 'admin' FROM public.profiles WHERE username = '0112973841' ON CONFLICT (user_id, role) DO NOTHING;
UPDATE public.profiles SET status = 'active' WHERE username = '0112973841';