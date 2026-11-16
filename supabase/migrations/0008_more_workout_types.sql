-- Ringo · tipos de entreno nuevos: tenis y trekking
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.workouts drop constraint if exists workouts_type_check;
alter table public.workouts
  add constraint workouts_type_check
  check (type in ('futbol', 'fuerza', 'correr', 'padel', 'tenis', 'trekking', 'otro'));
