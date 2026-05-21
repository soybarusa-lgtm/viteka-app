-- ═══════════════════════════════════════════════════════════
-- Añade columnas JSONB *_detail a pharmacy_equipment
-- para almacenar: distribuidor, soporte, val_distribuidor,
-- val_soporte y anotaciones por producto.
-- También columnas que faltaban para alinear con el código.
-- ═══════════════════════════════════════════════════════════

alter table public.pharmacy_equipment
  -- viteka flags que faltaban
  add column if not exists erp_viteka          boolean default false,
  add column if not exists erp_satisfaction    integer check (erp_satisfaction between 1 and 5),
  add column if not exists bascula_viteka      boolean default false,

  -- columnas *_detail JSONB (distribuidor, soporte, valoraciones, anotaciones)
  add column if not exists erp_detail          jsonb default '{}'::jsonb,
  add column if not exists cash_detail         jsonb default '{}'::jsonb,
  add column if not exists esl_detail          jsonb default '{}'::jsonb,
  add column if not exists scale_detail        jsonb default '{}'::jsonb,
  add column if not exists antitheft_detail    jsonb default '{}'::jsonb,
  add column if not exists consulting_detail   jsonb default '{}'::jsonb,
  add column if not exists robot_detail        jsonb default '{}'::jsonb,
  add column if not exists queue_detail        jsonb default '{}'::jsonb,
  add column if not exists spd_detail          jsonb default '{}'::jsonb,
  add column if not exists screens_detail      jsonb default '{}'::jsonb,
  add column if not exists fridge_detail       jsonb default '{}'::jsonb;
