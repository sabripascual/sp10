-- Ringo · objetivo semanal ("Tu semana ideal"): cuántas veces por semana de cada cosa.
-- Ej.: {"ayuno": 5, "fuerza": 2, "futbol": 1}. Sin configurar (null) = 5 ayunos + la meta de fierritos.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles
  add column if not exists weekly_goals jsonb;
