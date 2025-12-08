-- Campfires table for voice chat channels
-- Bonfire is the permanent public campfire (always exists, unlit until someone joins)
-- Other campfires are user-created and auto-douse when empty

create table if not exists public.campfires (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  creator_id uuid references public.profiles(id),
  is_lit boolean default false,
  is_bonfire boolean default false, -- Special flag for the permanent Bonfire
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  doused_at timestamptz,
  unique(name)
);

-- Campfire members junction table
create table if not exists public.campfire_members (
  id uuid primary key default gen_random_uuid(),
  campfire_id uuid not null references public.campfires(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(campfire_id, user_id)
);

-- RLS policies for campfires
alter table public.campfires enable row level security;

drop policy if exists "campfires_auth_select" on public.campfires;
create policy "campfires_auth_select" on public.campfires
  for select using (auth.role() = 'authenticated');

drop policy if exists "campfires_creator_all" on public.campfires;
create policy "campfires_creator_all" on public.campfires
  for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists "campfires_service_role_all" on public.campfires;
create policy "campfires_service_role_all" on public.campfires
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- RLS policies for campfire_members
alter table public.campfire_members enable row level security;

drop policy if exists "campfire_members_auth_select" on public.campfire_members;
create policy "campfire_members_auth_select" on public.campfire_members
  for select using (auth.role() = 'authenticated');

drop policy if exists "campfire_members_self_insert" on public.campfire_members;
create policy "campfire_members_self_insert" on public.campfire_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "campfire_members_self_delete" on public.campfire_members;
create policy "campfire_members_self_delete" on public.campfire_members
  for delete using (auth.uid() = user_id);

drop policy if exists "campfire_members_service_role_all" on public.campfire_members;
create policy "campfire_members_service_role_all" on public.campfire_members
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Create the permanent Bonfire
insert into public.campfires (name, is_bonfire, is_lit)
values ('Bonfire', true, false)
on conflict (name) do nothing;

-- Function to auto-douse campfires when empty
create or replace function auto_douse_empty_campfires()
returns trigger as $$
begin
  -- Update campfires that have no members and aren't the Bonfire
  update public.campfires
  set is_lit = false, doused_at = now()
  where id not in (select distinct campfire_id from public.campfire_members)
    and is_bonfire = false
    and is_lit = true;
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-douse when member leaves
drop trigger if exists trigger_auto_douse_campfires on public.campfire_members;
create trigger trigger_auto_douse_campfires
  after delete on public.campfire_members
  for each statement
  execute function auto_douse_empty_campfires();
