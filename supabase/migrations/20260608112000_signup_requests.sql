-- Solicitudes de alta que llegan desde el login.

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  pharmacy_name text not null,
  population text not null,
  city text not null,
  phone text not null,
  email text not null,
  current_software text not null,
  notes text,
  source text not null default 'login',
  status text not null default 'new',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signup_requests_status_check check (status in ('new', 'reviewed', 'in_progress', 'closed'))
);

create index if not exists idx_signup_requests_created_at on public.signup_requests(created_at desc);
create index if not exists idx_signup_requests_status_created_at on public.signup_requests(status, created_at desc);
create index if not exists idx_signup_requests_email on public.signup_requests(email);

drop trigger if exists set_updated_at_signup_requests on public.signup_requests;
create trigger set_updated_at_signup_requests
  before update on public.signup_requests
  for each row
  execute function public.set_updated_at();

alter table public.signup_requests enable row level security;

grant insert on public.signup_requests to anon;
grant select, insert, update, delete on public.signup_requests to authenticated;

drop policy if exists "signup_requests_insert_public" on public.signup_requests;
create policy "signup_requests_insert_public" on public.signup_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "signup_requests_select_config_admin" on public.signup_requests;
create policy "signup_requests_select_config_admin" on public.signup_requests
  for select
  to authenticated
  using (public.viteka_is_config_admin());

drop policy if exists "signup_requests_write_config_admin" on public.signup_requests;
create policy "signup_requests_write_config_admin" on public.signup_requests
  for update
  to authenticated
  using (public.viteka_is_config_admin())
  with check (public.viteka_is_config_admin());

drop policy if exists "signup_requests_delete_config_admin" on public.signup_requests;
create policy "signup_requests_delete_config_admin" on public.signup_requests
  for delete
  to authenticated
  using (public.viteka_is_config_admin());
