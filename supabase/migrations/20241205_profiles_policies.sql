-- RLS policies for profiles to allow self-access and service role management
alter table public.profiles enable row level security;

-- Authenticated users can see their own profile
create policy "profiles_self_select"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Authenticated users can insert their own profile row (id must match)
create policy "profiles_self_insert"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Authenticated users can update their own profile
create policy "profiles_self_update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role full access
create policy "profiles_service_role_all"
  on public.profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
