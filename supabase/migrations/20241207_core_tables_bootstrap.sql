-- Bootstrap missing core tables to satisfy frontend queries.

-- events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  event_type text,
  priority text,
  status text,
  start_time timestamptz,
  end_time timestamptz,
  location text,
  tags text[],
  assigned_asset_ids text[],
  created_by uuid,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
drop policy if exists "events_service_role_all" on public.events;
drop policy if exists "events_auth_select" on public.events;
create policy "events_service_role_all" on public.events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "events_auth_select" on public.events
  for select using (auth.role() = 'authenticated');

-- armory_items
create table if not exists public.armory_items (
  id uuid primary key default gen_random_uuid(),
  name text,
  status text,
  quantity integer,
  location text,
  updated_at timestamptz default now()
);
alter table public.armory_items enable row level security;
drop policy if exists "armory_items_service_role_all" on public.armory_items;
drop policy if exists "armory_items_auth_select" on public.armory_items;
create policy "armory_items_service_role_all" on public.armory_items
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "armory_items_auth_select" on public.armory_items
  for select using (auth.role() = 'authenticated');

-- fleet_assets
create table if not exists public.fleet_assets (
  id uuid primary key default gen_random_uuid(),
  name text,
  model text,
  type text,
  status text,
  location text,
  coordinates jsonb,
  maintenance_notes text,
  created_at timestamptz default now()
);
alter table public.fleet_assets enable row level security;
drop policy if exists "fleet_assets_service_role_all" on public.fleet_assets;
drop policy if exists "fleet_assets_auth_select" on public.fleet_assets;
create policy "fleet_assets_service_role_all" on public.fleet_assets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "fleet_assets_auth_select" on public.fleet_assets
  for select using (auth.role() = 'authenticated');

-- player_status
create table if not exists public.player_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_id uuid,
  assigned_squad_id uuid,
  status text,
  last_updated timestamptz default now()
);
alter table public.player_status enable row level security;
drop policy if exists "player_status_service_role_all" on public.player_status;
drop policy if exists "player_status_auth_select" on public.player_status;
create policy "player_status_service_role_all" on public.player_status
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "player_status_auth_select" on public.player_status
  for select using (auth.role() = 'authenticated');

-- voice_nets
create table if not exists public.voice_nets (
  id uuid primary key default gen_random_uuid(),
  code text,
  label text,
  type text,
  event_id uuid,
  priority integer,
  status text,
  created_at timestamptz default now()
);
alter table public.voice_nets enable row level security;
drop policy if exists "voice_nets_service_role_all" on public.voice_nets;
drop policy if exists "voice_nets_auth_select" on public.voice_nets;
create policy "voice_nets_service_role_all" on public.voice_nets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "voice_nets_auth_select" on public.voice_nets
  for select using (auth.role() = 'authenticated');

-- squads
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text,
  event_id uuid,
  leader_id uuid,
  created_at timestamptz default now()
);
alter table public.squads enable row level security;
drop policy if exists "squads_service_role_all" on public.squads;
drop policy if exists "squads_auth_select" on public.squads;
create policy "squads_service_role_all" on public.squads
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "squads_auth_select" on public.squads
  for select using (auth.role() = 'authenticated');

-- coffers
create table if not exists public.coffers (
  id uuid primary key default gen_random_uuid(),
  type text,
  balance numeric,
  updated_at timestamptz default now()
);
alter table public.coffers enable row level security;
drop policy if exists "coffers_service_role_all" on public.coffers;
drop policy if exists "coffers_auth_select" on public.coffers;
create policy "coffers_service_role_all" on public.coffers
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "coffers_auth_select" on public.coffers
  for select using (auth.role() = 'authenticated');
