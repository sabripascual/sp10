-- Ringo · clubes públicos o privados y solicitudes para sumarse a los públicos.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.clubs add column if not exists visibility text not null default 'private';
alter table public.clubs drop constraint if exists clubs_visibility_check;
alter table public.clubs add constraint clubs_visibility_check check (visibility in ('public', 'private'));

-- Solicitudes para entrar a un club público (las aprueba la dueña). Solo service role (RLS sin políticas).
create table if not exists public.club_requests (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
alter table public.club_requests enable row level security;
