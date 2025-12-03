-- Push subscriptions table
create table if not exists public.push_subscriptions (
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Flares table for rescue/combat alerts
create table if not exists public.flares (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('MEDICAL','COMBAT')),
  location text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','RESOLVED')),
  created_at timestamptz not null default now()
);

-- RLS policies for push_subscriptions (users manage only their own)
alter table public.push_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'insert_own_subscription'
  ) then
    create policy insert_own_subscription on public.push_subscriptions
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'select_own_subscription'
  ) then
    create policy select_own_subscription on public.push_subscriptions
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'delete_own_subscription'
  ) then
    create policy delete_own_subscription on public.push_subscriptions
      for delete
      using (auth.uid() = user_id);
  end if;
end;
$$;
