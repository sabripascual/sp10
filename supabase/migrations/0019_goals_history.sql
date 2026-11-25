-- Ringo · historial de la semana ideal: cada semana se califica con los objetivos que tenía.
-- Los cambios valen desde el lunes siguiente (así nadie baja la meta a mitad de semana para subir en el ranking).
-- Formato: [{"from":"2026-11-30","goals":{"ayuno":5,"fuerza":2}}, …] (from = lunes desde el que vale).
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles add column if not exists goals_history jsonb not null default '[]'::jsonb;
