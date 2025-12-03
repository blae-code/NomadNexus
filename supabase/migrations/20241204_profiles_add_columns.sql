-- Ensure profiles has the columns expected by the app
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists callsign text;
alter table public.profiles add column if not exists rsi_handle text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists discord_id text;
alter table public.profiles add column if not exists updated_at timestamptz;
