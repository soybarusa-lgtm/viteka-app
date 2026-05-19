-- ============================================================
-- VITEKA APP v2.0 — Schema completo limpio
-- Fecha: Mayo 2026
-- IMPORTANTE: Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- COMPANIES (multi-tenant base)
-- ============================================================
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  contact_email text,
  contact_phone text,
  created_at timestamptz default now()
);

-- ============================================================
-- PROFILES (usuarios internos y clientes)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id),
  full_name text,
  email text,
  role text check (role in ('owner','admin','technician','commercial','client')),
  portal_type text check (portal_type in ('internal','client')),
  pharmacy_id uuid,  -- solo para rol client
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PHARMACIES (farmacias)
-- ============================================================
create table if not exists pharmacies (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),

  -- Identificación
  pharmacy_name text not null,

  -- Tipo jurídico: 'autonomo' | 'cb' | 'sl' | 'autonomo_sl' | 'cb_sl'
  legal_type text not null,

  -- Datos Autónomo
  owner_name text,
  nif text,
  collegiate_number text,
  soe_number text,

  -- Datos CB
  razon_social text,
  cif text,
  cb_owners jsonb default '[]', -- [{name, nif, collegiate_number}]

  -- Datos SL (razon_social y cif se comparten con CB)
  -- sl_razon_social → usar razon_social
  -- sl_cif → usar cif

  -- Contacto
  contact_phone text,
  contact_email text,

  -- Ubicación
  address text,
  province text,
  city text,
  postal_code text,

  -- Operativa (solo Autónomo y CB)
  schedule text,
  has_guards boolean,
  observations text,

  -- Equipamiento general (jsonb)
  products jsonb default '{}',

  -- Estado
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PHARMACY CONTACTS (personas vinculadas a farmacia)
-- ============================================================
create table if not exists pharmacy_contacts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  pharmacy_id uuid references pharmacies(id) on delete cascade,

  full_name text not null,
  role text, -- 'titular','gestor','adjunto','tecnico','auxiliar'
  responsibilities jsonb default '[]', -- ['ventas','compras','almacen','rrhh']
  phone text,
  email text,
  observations text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PHARMACY EQUIPMENT (equipos informáticos detallados)
-- ============================================================
create table if not exists pharmacy_equipment (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  pharmacy_id uuid references pharmacies(id) on delete cascade,

  is_viteka boolean default false,
  equipment_type text, -- 'servidor','estacion','impresora_docs','impresora_tickets','impresora_etiquetas','sai','router','switch'
  brand text,
  model text,
  serial_number text,
  install_date date,
  warranty_end date,
  specs jsonb default '{}', -- campos técnicos específicos por tipo
  observations text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PROJECTS (proyectos comerciales y de soporte)
-- ============================================================
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  pharmacy_id uuid references pharmacies(id),

  project_type text check (project_type in ('commercial','support')) not null,
  name text not null,
  status text default 'active',
  notes text,
  start_date date,
  expected_close_date date,
  visible_to_client boolean default false,

  -- Soporte
  assigned_technician_id uuid references profiles(id),

  -- Comercial
  assigned_commercial_id uuid references profiles(id),
  pipeline_stage text default 'leads',
  -- leads | first_contact | meeting | demo | budget | negotiation | waiting_commitment | waiting_finance | won | lost
  amount numeric(10,2),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TASKS (tareas vinculadas a proyectos)
-- ============================================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  project_id uuid references projects(id) on delete cascade,

  title text not null,
  description text,
  status text default 'pending',
  -- pending | in_progress | completed | blocked | not_applicable
  assigned_technician_id uuid references profiles(id),
  due_date date,
  required boolean default false,
  template_id uuid,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TASK EVIDENCE (evidencias fotográficas)
-- ============================================================
create table if not exists task_evidence (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  file_path text not null,
  file_name text,
  file_size int,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- INCIDENTS (incidencias)
-- ============================================================
create table if not exists incidents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  pharmacy_id uuid references pharmacies(id),
  project_id uuid references projects(id), -- nullable: puede ser independiente

  title text not null,
  description text,
  priority text default 'medium',
  -- low | medium | high | critical
  status text default 'open',
  -- open | in_progress | resolved | closed
  assigned_technician_id uuid references profiles(id),
  resolution text,
  resolved_at date,
  visible_to_client boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CHECKLIST TEMPLATES
-- ============================================================
create table if not exists checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  name text not null,
  description text,
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists checklist_template_sections (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references checklist_templates(id) on delete cascade,
  title text not null,
  position int default 0
);

create table if not exists checklist_template_tasks (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references checklist_template_sections(id) on delete cascade,
  title text not null,
  description text,
  required boolean default false,
  position int default 0
);

-- ============================================================
-- CHECKLISTS (ejecuciones sobre proyectos/tareas)
-- ============================================================
create table if not exists checklists (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id),
  template_id uuid references checklist_templates(id),
  title text not null,
  status text default 'in_progress',
  -- in_progress | completed
  visible_to_client boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists checklist_sections (
  id uuid primary key default uuid_generate_v4(),
  checklist_id uuid references checklists(id) on delete cascade,
  title text not null,
  position int default 0
);

create table if not exists checklist_tasks (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references checklist_sections(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending',
  required boolean default false,
  position int default 0,
  completed_by uuid references profiles(id),
  completed_at timestamptz
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  pharmacy_id uuid references pharmacies(id),
  contact_id uuid references pharmacy_contacts(id),

  name text not null,
  file_path text not null,
  file_size int,
  file_type text,
  doc_type text default 'generic',
  -- generic | private
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOGS (auditoría)
-- ============================================================
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  user_id uuid references profiles(id),
  user_name text,

  entity_type text, -- 'pharmacy' | 'project' | 'task' | 'incident' | etc.
  entity_id uuid,
  entity_name text,
  action text, -- 'create' | 'update' | 'delete'
  old_value jsonb,
  new_value jsonb,

  created_at timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  company_id uuid references companies(id),

  title text not null,
  message text,
  type text default 'info',
  -- info | warning | error | success
  entity_type text,
  entity_id uuid,
  read boolean default false,
  send_email boolean default false,

  created_at timestamptz default now()
);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table companies enable row level security;
alter table profiles enable row level security;
alter table pharmacies enable row level security;
alter table pharmacy_contacts enable row level security;
alter table pharmacy_equipment enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_evidence enable row level security;
alter table incidents enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_sections enable row level security;
alter table checklist_template_tasks enable row level security;
alter table checklists enable row level security;
alter table checklist_sections enable row level security;
alter table checklist_tasks enable row level security;
alter table documents enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;
alter table pharmacy_contacts enable row level security;

-- Helper: obtener company_id del usuario autenticado
create or replace function get_my_company_id()
returns uuid
language sql stable
as $$
  select company_id from profiles where id = auth.uid()
$$;

-- Helper: obtener rol del usuario autenticado
create or replace function get_my_role()
returns text
language sql stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- Policies: pharmacies
create policy "pharmacies_select" on pharmacies
  for select using (company_id = get_my_company_id());

create policy "pharmacies_insert" on pharmacies
  for insert with check (
    company_id = get_my_company_id()
    and get_my_role() in ('owner','admin','commercial')
  );

create policy "pharmacies_update" on pharmacies
  for update using (
    company_id = get_my_company_id()
    and get_my_role() in ('owner','admin','commercial')
  );

create policy "pharmacies_delete" on pharmacies
  for delete using (
    company_id = get_my_company_id()
    and get_my_role() in ('owner','admin')
  );

-- Policies: profiles
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid() or company_id = get_my_company_id());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- Policies: projects
create policy "projects_select" on projects
  for select using (
    company_id = get_my_company_id()
    and (
      get_my_role() in ('owner','admin','commercial')
      or assigned_technician_id = auth.uid()
      or assigned_commercial_id = auth.uid()
    )
  );

create policy "projects_insert" on projects
  for insert with check (company_id = get_my_company_id());

create policy "projects_update" on projects
  for update using (company_id = get_my_company_id());

create policy "projects_delete" on projects
  for delete using (
    company_id = get_my_company_id()
    and get_my_role() in ('owner','admin')
  );

-- Policies genéricas para resto de tablas (company_id match)
create policy "pharmacy_contacts_all" on pharmacy_contacts
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "pharmacy_equipment_all" on pharmacy_equipment
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "tasks_all" on tasks
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "incidents_all" on incidents
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "documents_all" on documents
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "activity_logs_all" on activity_logs
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "notifications_own" on notifications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "checklist_templates_all" on checklist_templates
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "checklists_all" on checklists
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_pharmacies
  before update on pharmacies
  for each row execute function update_updated_at();

create trigger set_updated_at_projects
  before update on projects
  for each row execute function update_updated_at();

create trigger set_updated_at_tasks
  before update on tasks
  for each row execute function update_updated_at();

create trigger set_updated_at_incidents
  before update on incidents
  for each row execute function update_updated_at();

create trigger set_updated_at_profiles
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- STORAGE BUCKETS (ejecutar en Supabase Dashboard > Storage)
-- ============================================================
-- Crear manualmente en el Dashboard:
--   bucket: task-evidence  (privado)
--   bucket: documents      (privado)
--   bucket: avatars        (público)
