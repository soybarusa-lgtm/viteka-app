-- ═══════════════════════════════════════════════════════════════
-- Equipamiento informático
-- ═══════════════════════════════════════════════════════════════
create table if not exists pharmacy_it_devices (
  id           uuid primary key default gen_random_uuid(),
  pharmacy_id  uuid not null references pharmacies(id) on delete cascade,
  company_id   uuid not null,
  device_type  text not null,          -- servidor | estacion | impresora_* | sai | router | switch
  label        text,                   -- nombre libre p.ej. "Servidor principal"
  is_viteka    boolean not null default false,
  serial_number text,
  install_date  date,
  warranty_end  date,
  specs        jsonb not null default '{}',  -- todos los campos específicos por tipo
  observations text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table pharmacy_it_devices enable row level security;

create policy "company isolation it_devices" on pharmacy_it_devices
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- Personas
-- ═══════════════════════════════════════════════════════════════
create table if not exists pharmacy_persons (
  id             uuid primary key default gen_random_uuid(),
  pharmacy_id    uuid not null references pharmacies(id) on delete cascade,
  company_id     uuid not null,
  name           text not null,
  phone          text,
  email          text,
  role           text not null default 'Titular',   -- Titular|Adjunto|Gestor|Técnico|Auxiliar|Otro
  is_responsible boolean not null default false,
  areas          text[] not null default '{}',       -- Gestión|Compras|Ventas|Almacén|RRHH|Informática|Equipamiento|Categoría
  custom_area    text,                               -- cuando areas incluye "Categoría"
  observations   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table pharmacy_persons enable row level security;

create policy "company isolation persons" on pharmacy_persons
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- Documentos
-- ═══════════════════════════════════════════════════════════════
create table if not exists pharmacy_documents (
  id            uuid primary key default gen_random_uuid(),
  pharmacy_id   uuid not null references pharmacies(id) on delete cascade,
  company_id    uuid not null,
  name          text not null,
  category      text not null default 'Otros',   -- Contratos|Informes|Presupuestos|Facturas|Otros
  storage_path  text not null,
  public_url    text not null,
  file_ext      text,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

alter table pharmacy_documents enable row level security;

create policy "company isolation documents" on pharmacy_documents
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- Columnas nuevas en pharmacy_equipment
-- (ejecutar solo si no existen)
-- ═══════════════════════════════════════════════════════════════
alter table pharmacy_equipment
  add column if not exists frigorifico_viteka       boolean default false,
  add column if not exists frigorifico_satisfaction integer,
  add column if not exists consultoria_viteka       boolean default false;
