-- =============================================================
-- Migration: ampliar tabla pharmacies para tipos jurídicos
-- Fecha: 2026-05-20
-- =============================================================

-- 1. Añadir columna sl_data (datos propios de la S.L. cuando convive con Autónomo o C.B.)
alter table public.pharmacies
  add column if not exists sl_data jsonb default null;

-- 2. Añadir columna cb_owners (array de titulares de la C.B.)
alter table public.pharmacies
  add column if not exists cb_owners jsonb default '[]'::jsonb;

-- 3. Añadir columna razon_social (C.B. o S.L. en solitario)
alter table public.pharmacies
  add column if not exists razon_social text default null;

-- 4. Añadir columna cif
alter table public.pharmacies
  add column if not exists cif text default null;

-- 5. Actualizar constraint de legal_type para contemplar todas las combinaciones posibles
--    Primero eliminamos el antiguo check si existe
alter table public.pharmacies
  drop constraint if exists pharmacies_legal_type_check;

alter table public.pharmacies
  add constraint pharmacies_legal_type_check
  check (legal_type in (
    'autonomo',
    'cb',
    'sl',
    'autonomo_sl',
    'cb_sl'
  ));

-- 6. Índice GIN sobre sl_data para búsquedas por CIF o razón social de la S.L.
create index if not exists idx_pharmacies_sl_data
  on public.pharmacies using gin (sl_data);

-- 7. Índice GIN sobre cb_owners para búsquedas por nombre/NIF de titular
create index if not exists idx_pharmacies_cb_owners
  on public.pharmacies using gin (cb_owners);

-- 8. Comentarios de columna
comment on column public.pharmacies.sl_data is
  'Datos propios de la S.L. cuando convive con Autónomo o C.B.: {razon_social, cif, phone, email, address, province, city, postal_code, observations}';

comment on column public.pharmacies.cb_owners is
  'Array de titulares de la C.B.: [{name, nif, collegiate}]';
