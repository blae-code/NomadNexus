-- Ensure profiles.rank column exists and has no default that would override user values
alter table public.profiles add column if not exists rank text;

-- Remove any default value that might be overriding updates
alter table public.profiles alter column rank drop default;

-- Add a check constraint to ensure valid rank values (optional, can be removed if too restrictive)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_rank_check'
  ) then
    alter table public.profiles add constraint profiles_rank_check
      check (rank in ('vagrant', 'scout', 'voyager', 'founder', 'pioneer') or rank is null);
  end if;
end;
$$;
