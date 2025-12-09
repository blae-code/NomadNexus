-- Create voice_net_bridges table for linking two voice nets (Founder+ only)
-- This enables commanders to bridge nets for cross-communication
create table if not exists public.voice_net_bridges (
  id uuid primary key default gen_random_uuid(),
  source_net_id uuid not null references public.voice_nets(id) on delete cascade,
  target_net_id uuid not null references public.voice_nets(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(source_net_id, target_net_id)
);

alter table if exists public.voice_net_bridges enable row level security;

-- Drop existing policies if they exist
drop policy if exists "voice_net_bridges_service_role_all" on public.voice_net_bridges;
drop policy if exists "voice_net_bridges_auth_select" on public.voice_net_bridges;

-- Service role full access
create policy "voice_net_bridges_service_role_all" on public.voice_net_bridges
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Authenticated users can read bridges
create policy "voice_net_bridges_auth_select" on public.voice_net_bridges
  for select using (auth.role() = 'authenticated');
