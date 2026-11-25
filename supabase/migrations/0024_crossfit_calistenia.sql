-- Ringo · tipos de entreno nuevos: crossfit y calistenia
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.workouts drop constraint if exists workouts_type_check;
alter table public.workouts
  add constraint workouts_type_check
  check (type in ('futbol', 'fuerza', 'correr', 'padel', 'tenis', 'squash', 'trekking', 'bici', 'crossfit', 'calistenia', 'otro'));
