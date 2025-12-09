-- Notification Queue Table
-- Stores pending notifications for async delivery via Web Push or in-app delivery
-- Used by Edge Functions (academy-request, handle-rescue-request) to enqueue notifications
-- Can be consumed by a background worker process for reliable delivery

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- e.g., 'academy_request', 'rescue_flare', 'combat_flare', 'mention'
  title text,
  message text not null,
  payload jsonb, -- Custom data for the notification
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now(),
  
  -- Index for efficient queue polling
  created_at desc
);

-- Enable RLS
alter table public.notification_queue enable row level security;

-- Service role (Edge Functions) can insert/update
create policy "notification_queue_service_role_all" on public.notification_queue
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Authenticated users can read their own notifications
create policy "notification_queue_auth_select" on public.notification_queue
  for select using (auth.uid() = recipient_id);

-- Authenticated users can mark their own notifications as read
create policy "notification_queue_auth_update" on public.notification_queue
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Indexes for efficient queries
create index if not exists idx_notification_queue_recipient on public.notification_queue(recipient_id);
create index if not exists idx_notification_queue_type on public.notification_queue(type);
create index if not exists idx_notification_queue_read on public.notification_queue(read_at);
create index if not exists idx_notification_queue_created on public.notification_queue(created_at desc);

-- Trigger: auto-populate recipient_id if email matches
-- (Not used in current flow, but useful for manual inserts)
create or replace function populate_recipient_id()
returns trigger
language plpgsql
as $$
begin
  if new.recipient_id is null then
    select id into new.recipient_id from public.profiles
    where email = new.email
    limit 1;
  end if;
  return new;
end;
$$;

comment on table public.notification_queue is 'Queue of pending notifications for Web Push, in-app, or email delivery';
comment on column public.notification_queue.type is 'Notification type: academy_request, rescue_flare, combat_flare, mention, academy_accept, etc.';
comment on column public.notification_queue.payload is 'Custom JSON data for the notification: {skillId, cadetId, requestId, flareType, location, etc.}';
comment on column public.notification_queue.read_at is 'Timestamp when user read/dismissed the notification';
comment on column public.notification_queue.sent_at is 'Timestamp when Web Push was delivered (null if pending)';
