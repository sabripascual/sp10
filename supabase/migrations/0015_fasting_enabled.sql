-- Ringo · ¿hacés ayuno? Si está en false, la app esconde todo lo del ayuno
-- (pestaña, tarjeta, avisos y objetivo) y muestra "Alimentación" en su lugar.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles add column if not exists fasting_enabled boolean not null default true;
