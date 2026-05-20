-- ═══════════════════════════════════════════════════════════
-- TABLA: pharmacy_equipment
-- Almacena todos los bloques de equipamiento de una farmacia
-- (ERP, caja cobro, etiquetas, básculas, etc.) como JSONB
-- ═══════════════════════════════════════════════════════════
create table if not exists public.pharmacy_equipment (
  id            uuid primary key default gen_random_uuid(),
  pharmacy_id   uuid not null references public.pharmacies(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,

  -- ERP
  erp_brand         text,   -- nixfarma | farmatic | unycop | farmanager | unicop_win | vgaleno | compufarma | otro
  erp_license       text,
  erp_seats         int,
  erp_start_year    int,
  erp_products      text,
  erp_other_name    text,

  -- Caja de cobro
  cash_brand        text,   -- no | cashlogy | cashinfinity | cashkeeper | cashdro | cashprotect | otro
  cash_model        text,
  cash_year         int,
  cash_other_model  text,
  cash_viteka_dist  boolean,
  cash_viteka_support text,
  cash_satisfaction int check (cash_satisfaction between 1 and 5),

  -- Etiquetas electrónicas
  esl_brand         text,   -- no | hanshow | pricer | expofarm | farmaconnet | otro
  esl_other_name    text,
  esl_year          int,
  esl_viteka_dist   boolean,
  esl_viteka_support text,
  esl_satisfaction  int check (esl_satisfaction between 1 and 5),

  -- Básculas
  scale_brand       text,   -- no | pondus | keito | otro
  scale_other_name  text,
  scale_year        int,
  scale_viteka_dist boolean,
  scale_viteka_support text,

  -- Antihurto
  antitheft_brand   text,   -- no | checkpoint | otro
  antitheft_other   text,
  antitheft_year    int,

  -- Consultoría
  consulting_brand  text,   -- no | viteka_pro | avantia_plus | otro
  consulting_other  text,
  consulting_start_month int,
  consulting_start_year  int,

  -- Equipos informáticos (proveedor general)
  it_provider       text,   -- viteka | otros

  -- Robot dispensador
  robot_brand       text,   -- no | bd_rowa | gollmann | meditech | willach | fablox | luse | kls | tecnyfarma | otro
  robot_other       text,
  robot_year        int,

  -- Cruz
  cross_has         text,   -- si | no | puede_ampliar
  cross_count       int,
  cross_expand_count int,

  -- Gestor de turnos
  queue_has         boolean,
  queue_brand       text,
  queue_year        int,

  -- SPD
  spd_has           boolean,
  spd_brand         text,
  spd_year          int,

  -- Pantallas
  screens_has       boolean,
  screens_brand     text,
  screens_year      int,
  screens_locations text[],  -- ['interior','escaparate','exterior']

  -- Frigorífico
  fridge_brand      text,
  fridge_year       int,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.pharmacy_equipment enable row level security;

create policy "equipment_select" on public.pharmacy_equipment
  for select using (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "equipment_insert" on public.pharmacy_equipment
  for insert with check (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "equipment_update" on public.pharmacy_equipment
  for update using (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "equipment_delete" on public.pharmacy_equipment
  for delete using (company_id = (select company_id from public.profiles where id = auth.uid()));

-- ═══════════════════════════════════════════════════════════
-- TABLA: pharmacy_devices
-- Un registro por equipo informático individual
-- ═══════════════════════════════════════════════════════════
create table if not exists public.pharmacy_devices (
  id              uuid primary key default gen_random_uuid(),
  pharmacy_id     uuid not null references public.pharmacies(id) on delete cascade,
  company_id      uuid not null references public.companies(id) on delete cascade,

  device_type     text not null,  -- servidor | estacion | impresora_docs | impresora_tickets | impresora_etiquetas | sai | router | switch
  is_viteka       boolean default false,

  -- Control VITEKA
  serial_number   text,
  install_date    date,
  warranty_end    date,
  observations    text,

  -- Datos específicos almacenados como JSONB por flexibilidad
  specs           jsonb default '{}'::jsonb,

  sort_order      int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.pharmacy_devices enable row level security;

create policy "devices_select" on public.pharmacy_devices
  for select using (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "devices_insert" on public.pharmacy_devices
  for insert with check (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "devices_update" on public.pharmacy_devices
  for update using (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "devices_delete" on public.pharmacy_devices
  for delete using (company_id = (select company_id from public.profiles where id = auth.uid()));

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_equipment_updated_at on public.pharmacy_equipment;
create trigger trg_equipment_updated_at
  before update on public.pharmacy_equipment
  for each row execute function public.set_updated_at();

drop trigger if exists trg_devices_updated_at on public.pharmacy_devices;
create trigger trg_devices_updated_at
  before update on public.pharmacy_devices
  for each row execute function public.set_updated_at();
