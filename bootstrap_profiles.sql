insert into public.profiles (id, email, rank)
select id, email, 'scout'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
