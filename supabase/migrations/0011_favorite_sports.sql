-- Ringo · deportes frecuentes de cada usuaria (los bloques de un toque en Hoy)
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles
  add column if not exists favorite_sports text[] not null default array['fuerza', 'correr', 'futbol', 'padel'];
