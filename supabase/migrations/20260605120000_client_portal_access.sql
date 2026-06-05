-- Portal cliente seguro: accesos, perfiles y roles ampliados.

alter table public.profiles
  add column if not exists auth_user_id uuid,
  add column if not exists must_change_password boolean not null default false;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'owner',
    'administrador',
    'soporte',
    'administracion',
    'cliente_owner',
    'cliente_user',
    'client',
    'cliente',
    'commercial',
    'comercial',
    'admin',
    'superadmin',
    'technician',
    'tecnico',
    'support',
    'administrativo'
  ));

create table if not exists public.client_portal_access (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  pharmacy_id uuid references public.pharmacies(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  email text not null,
  full_name text,
  role text not null default 'cliente_user',
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  invite_sent_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_portal_access_role_check check (role in ('cliente_owner', 'cliente_user'))
);

create index if not exists idx_client_portal_access_pharmacy on public.client_portal_access(pharmacy_id);
create index if not exists idx_client_portal_access_email on public.client_portal_access(email);
create index if not exists idx_client_portal_access_role on public.client_portal_access(role);

drop trigger if exists set_updated_at_client_portal_access on public.client_portal_access;
create trigger set_updated_at_client_portal_access
  before update on public.client_portal_access
  for each row
  execute function public.set_updated_at();

alter table public.client_portal_access enable row level security;

grant select, insert, update, delete on public.client_portal_access to authenticated;

drop policy if exists "client_portal_access_select_config_admin" on public.client_portal_access;
create policy "client_portal_access_select_config_admin" on public.client_portal_access
  for select to authenticated
  using (public.viteka_is_config_admin());

drop policy if exists "client_portal_access_write_config_admin" on public.client_portal_access;
create policy "client_portal_access_write_config_admin" on public.client_portal_access
  for all to authenticated
  using (public.viteka_is_config_admin())
  with check (public.viteka_is_config_admin());

insert into public.app_settings (key, title, description, value, sort_order)
values
  ('client_portal', 'Portal cliente', 'Accesos, invitaciones, politicas de acceso y recuperacion de contrasenas.', '{"enabled":true,"inviteFlow":true,"resetFlow":true,"mustChangePassword":true}'::jsonb, 70)
on conflict (key) do update
set title = excluded.title,
    description = excluded.description,
    value = excluded.value,
    sort_order = excluded.sort_order,
    updated_at = now();
