-- Ringo · configuración general de la app (la maneja el admin desde el Panel Ringo).
-- Por ahora: qué avisos del coach están prendidos para todas ({"level_result": false, ...}; lo que falta = prendido).
-- Solo el service role la lee y escribe (RLS sin políticas). Las acciones del panel verifican que seas admin.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
