-- Track when a registered user accepts the "Neural Link" consent form.
-- Guests do not need this field; default is NULL.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz NULL;
