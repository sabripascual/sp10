-- Ringo · último ingreso a la app (para el Panel): se actualiza al abrir la app (como mucho cada 10 min).
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles add column if not exists last_seen_at timestamptz;
