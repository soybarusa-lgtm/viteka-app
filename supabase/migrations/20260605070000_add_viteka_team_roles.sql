-- Roles internos Viteka, configuracion global y auditoria.
-- Mantiene roles legacy para no romper soporte/portal cliente existentes.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists is_active boolean not null default true,
  add column if not exists department text,
  add column if not exists internal_notes text,
  add column if not exists last_login_at timestamptz;

update public.profiles
set role = case
  when role = 'superadmin' then 'owner'
  when role = 'admin' then 'administrador'
  when role in ('technician', 'tecnico', 'support') then 'soporte'
  when role in ('administración', 'administrativo') then 'administracion'
  else role
end
where role in ('superadmin', 'admin', 'technician', 'tecnico', 'support', 'administración', 'administrativo');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'owner',
    'administrador',
    'soporte',
    'administracion',
    'client',
    'cliente',
    'commercial',
    'comercial',
    'admin',
    'superadmin',
    'technician',
    'tecnico'
  ));

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case role
    when 'administrador' then 'admin'
    when 'soporte' then 'technician'
    when 'administracion' then 'admin'
    else role
  end
  from public.profiles
  where id = auth.uid()
$$;

create table if not exists public.app_settings (
  key text primary key,
  title text not null,
  description text,
  value jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  actor_name text,
  old_values jsonb,
  new_values jsonb,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

create or replace function public.viteka_is_config_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role in ('owner', 'administrador', 'admin', 'superadmin')
    from public.profiles
    where id = auth.uid()
  ), false)
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_app_settings on public.app_settings;
create trigger set_updated_at_app_settings
  before update on public.app_settings
  for each row
  execute function public.set_updated_at();

alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert, update, delete on public.app_settings to authenticated;
grant select, insert on public.audit_logs to authenticated;

drop policy if exists "app_settings_select_config_admin" on public.app_settings;
create policy "app_settings_select_config_admin" on public.app_settings
  for select to authenticated
  using (public.viteka_is_config_admin());

drop policy if exists "app_settings_write_config_admin" on public.app_settings;
create policy "app_settings_write_config_admin" on public.app_settings
  for all to authenticated
  using (public.viteka_is_config_admin())
  with check (public.viteka_is_config_admin());

drop policy if exists "audit_logs_select_config_admin" on public.audit_logs;
create policy "audit_logs_select_config_admin" on public.audit_logs
  for select to authenticated
  using (public.viteka_is_config_admin());

drop policy if exists "audit_logs_insert_config_admin" on public.audit_logs;
create policy "audit_logs_insert_config_admin" on public.audit_logs
  for insert to authenticated
  with check (public.viteka_is_config_admin());

insert into public.app_settings (key, title, description, value, sort_order)
values
  ('identity', 'Identidad visual', 'Logo, nombre de marca, tono visual y textos corporativos.', '{"brandName":"Viteka","primaryColor":"#00695c","accentColor":"#8bc34a"}'::jsonb, 10),
  ('modules', 'Modulos activos', 'Farmacias, proyectos, soporte, documentos y portal cliente.', '{"farmacias":true,"proyectos":true,"soporte":true,"documentos":true,"portalCliente":true}'::jsonb, 20),
  ('custom_fields', 'Campos personalizados', 'Parametros extra para fichas, equipos, personas y documentos.', '{"farmacias":["SOE","Guardias"],"equipos":["Distribuidor","Soporte"]}'::jsonb, 30),
  ('support', 'Soporte y tickets', 'SLA, prioridades, estados y reglas de comunicacion.', '{"slaHours":8,"defaultPriority":"media","clientPortal":true}'::jsonb, 40),
  ('notifications', 'Notificaciones', 'Avisos internos, correo y recordatorios operativos.', '{"email":true,"dailyDigest":true,"ticketAlerts":true}'::jsonb, 50),
  ('security', 'Seguridad', 'Control de acceso, auditoria y sesiones.', '{"auditEnabled":true,"sessionReviewDays":30}'::jsonb, 60)
on conflict (key) do update
set title = excluded.title,
    description = excluded.description,
    value = excluded.value,
    sort_order = excluded.sort_order,
    updated_at = now();
