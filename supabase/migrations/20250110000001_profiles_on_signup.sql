-- Create profiles automatically on user signup
-- This ensures every authenticated user has a profile with a default rank

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, rank)
  values (new.id, new.email, 'scout')
  on conflict (id) do update
  set email = new.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bootstrap: Create profiles for existing users without profiles
insert into public.profiles (id, email, rank)
select id, email, 'scout'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
