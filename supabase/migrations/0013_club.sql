-- Ringo · Ringo Club: ranking de niveles entre amigas. Es opcional (opt-in):
-- solo aparece quien se suma, con el nombre que elige. Se muestra nivel y puntos, nunca datos de salud.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles
  add column if not exists club_visible boolean not null default false,
  add column if not exists club_name text check (club_name is null or char_length(club_name) between 1 and 20);
