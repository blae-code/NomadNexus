-- Voice Presence Mirror Table
-- Mirrors LiveKit participant presence events (participant_joined, participant_left)
-- Used by livekit-webhook function to maintain real-time participant roster in database
-- Populated by webhook events, consumed by presence visualizations

create table if not exists public.voice_presence (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  participant_identity text not null,
  participant_sid text,
  participant_metadata jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  joined_at timestamptz default now(),
  left_at timestamptz,
  
  -- Ensure one active presence per participant per room
  unique(room_name, participant_identity)
);

-- Enable RLS
alter table public.voice_presence enable row level security;

-- Service role can do everything
create policy "voice_presence_service_role_all" on public.voice_presence
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Authenticated users can read presence in any room
create policy "voice_presence_auth_select" on public.voice_presence
  for select using (auth.role() = 'authenticated');

-- Add index on room_name for faster lookups
create index if not exists idx_voice_presence_room on public.voice_presence(room_name);
create index if not exists idx_voice_presence_participant on public.voice_presence(participant_identity);
create index if not exists idx_voice_presence_user on public.voice_presence(user_id);

-- Auto-cleanup: mark participants as left when not updated in 5 minutes
-- This prevents stale presence entries if webhooks fail
create or replace function cleanup_stale_presence()
returns void
language plpgsql
as $$
begin
  update public.voice_presence
  set left_at = now()
  where left_at is null
    and joined_at < now() - interval '5 minutes'
    and updated_at < now() - interval '5 minutes';
end;
$$;

comment on table public.voice_presence is 'Mirror of LiveKit participant presence, populated by livekit-webhook events';
comment on column public.voice_presence.room_name is 'LiveKit room name (matches voice_nets.code)';
comment on column public.voice_presence.participant_identity is 'LiveKit participant identity (typically user ID)';
comment on column public.voice_presence.participant_sid is 'LiveKit participant SID (unique per room)';
comment on column public.voice_presence.participant_metadata is 'Metadata JSON from LiveKit: {userId, role, rank}';
comment on column public.voice_presence.left_at is 'Null while participant is in room; set when left event received';
