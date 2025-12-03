-- Guest Access Policies
-- Adjust table names/fields as needed. Assumes RLS is enabled.

-- Add guest metadata columns if they don't exist
alter table profiles add column if not exists is_guest boolean default false;
alter table profiles add column if not exists guest_expires_at timestamptz;

-- Allow guests (is_guest=true and not expired) to read limited data.
-- Profiles: expose only whitelisted columns.
alter table profiles enable row level security;
create policy "Guests can read limited profiles"
  on profiles
  for select
  using (
    auth.uid() = id
    or (
      exists (
        select 1
        from profiles p
        where p.id = auth.uid()
          and coalesce(p.is_guest, false) = true
          and coalesce(p.guest_expires_at, now()) > now()
      )
    )
  );

-- Events policies only if table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'events'
  ) then
    alter table events enable row level security;

    create policy "Guests can read events"
      on events
      for select
      using (
        exists (
          select 1
          from profiles p
          where p.id = auth.uid()
            and coalesce(p.is_guest, false) = true
            and coalesce(p.guest_expires_at, now()) > now()
        )
        or auth.role() = 'authenticated'
      );

    create policy "Guests cannot modify events"
      on events
      for insert
      using (
        auth.role() = 'authenticated'
        and not exists (
          select 1
          from profiles p
          where p.id = auth.uid()
            and coalesce(p.is_guest, false) = true
        )
      )
      with check (
        auth.role() = 'authenticated'
        and not exists (
          select 1
          from profiles p
          where p.id = auth.uid()
            and coalesce(p.is_guest, false) = true
        )
      );

    create policy "Guests cannot update events"
      on events
      for update
      using (
        auth.role() = 'authenticated'
        and not exists (
          select 1
          from profiles p
          where p.id = auth.uid()
            and coalesce(p.is_guest, false) = true
        )
      )
      with check (
        auth.role() = 'authenticated'
        and not exists (
          select 1
          from profiles p
          where p.id = auth.uid()
            and coalesce(p.is_guest, false) = true
        )
      );

    create policy "Guests cannot delete events"
      on events
      for delete
      using (
        auth.role() = 'authenticated'
        and not exists (
          select 1
          from profiles p
          where p.id = auth.uid()
            and coalesce(p.is_guest, false) = true
        )
      );
  end if;
end
$$;

-- Add similar deny/allow patterns per table as needed (messages, instruction_requests, etc.).
