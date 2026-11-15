-- SP10 · Etapa 2b · botones Empezar y Terminar
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

alter table public.fast_days
  add column if not exists started_at timestamptz, -- inicio real (si se tocó "Empezar")
  add column if not exists ended_at timestamptz;   -- fin real (si se tocó "Terminar")
