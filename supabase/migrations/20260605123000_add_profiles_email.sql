-- Optional compatibility column for legacy admin/profile flows.
-- Safe to apply in projects where profile emails are stored alongside auth users.

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and coalesce(p.email, '') = '';

create index if not exists idx_profiles_email on public.profiles(email);
