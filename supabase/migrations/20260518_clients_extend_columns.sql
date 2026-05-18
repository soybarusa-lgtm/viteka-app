-- Migración: extender tabla clients con columnas del formulario CreateClientModal
-- Ejecutar en Supabase SQL Editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS legal_type        text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cb_owners         jsonb     DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS products          jsonb     DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_guards        boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule          text,
  ADD COLUMN IF NOT EXISTS collegiate_number text,
  ADD COLUMN IF NOT EXISTS sl_name           text,
  ADD COLUMN IF NOT EXISTS sl_cif            text,
  ADD COLUMN IF NOT EXISTS sl_phone          text,
  ADD COLUMN IF NOT EXISTS sl_email          text;
