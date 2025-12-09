-- Add RBAC columns to voice_nets table
-- These columns define minimum rank requirements for joining and transmitting on voice nets

alter table if exists public.voice_nets
  add column if not exists min_rank_to_join text default 'scout',
  add column if not exists min_rank_to_rx text default 'scout',
  add column if not exists min_rank_to_tx text default 'scout',
  add column if not exists linked_squad_id uuid references public.squads(id) on delete set null;

-- Create index for efficient RBAC lookups
create index if not exists idx_voice_nets_min_rank_join on public.voice_nets(min_rank_to_join);
create index if not exists idx_voice_nets_min_rank_rx on public.voice_nets(min_rank_to_rx);
create index if not exists idx_voice_nets_min_rank_tx on public.voice_nets(min_rank_to_tx);
create index if not exists idx_voice_nets_linked_squad on public.voice_nets(linked_squad_id);

comment on column public.voice_nets.min_rank_to_join is 'Minimum rank required to join this net (vagrant/scout/voyager/founder/pioneer)';
comment on column public.voice_nets.min_rank_to_rx is 'Minimum rank required to subscribe/listen (defaults to min_rank_to_join)';
comment on column public.voice_nets.min_rank_to_tx is 'Minimum rank required to publish/transmit (defaults to scout, vagrant is listen-only)';
comment on column public.voice_nets.linked_squad_id is 'Optional: links net to squad membership for access control';
