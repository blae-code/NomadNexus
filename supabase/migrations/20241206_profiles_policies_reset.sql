-- Reset profiles RLS policies to avoid recursion errors
alter table public.profiles enable row level security;

-- Drop prior policies if they exist
drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_service_role_all" on public.profiles;
drop policy if exists "Guests can read limited profiles" on public.profiles;

-- Service role full access
create policy "profiles_service_role_all"
  on public.profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Authenticated users can select their own row
create policy "profiles_self_select"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Authenticated users can insert their own row
create policy "profiles_self_insert"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Authenticated users can update their own row
create policy "profiles_self_update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
