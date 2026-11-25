-- Ringo · clubes propios: cada club con su dueña, su link de invitación y su ranking.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- Todo se lee y escribe desde el servidor con service role (con los chequeos de dueña / miembro / tope en la app):
-- RLS prendido y sin políticas, así nadie lee clubes ajenos desde el navegador.

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  owner_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);
alter table public.clubs enable row level security;

create table if not exists public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null check (char_length(display_name) between 1 and 20),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
alter table public.club_members enable row level security;
create index if not exists club_members_user on public.club_members (user_id);

-- Migración: "Ringo Club" de la admin original con todas las que ya estaban sumadas al Club
do $$
declare
  owner uuid;
  club uuid;
begin
  select id into owner from public.profiles where role = 'admin' order by created_at limit 1;
  if owner is null then return; end if;
  select id into club from public.clubs where owner_id = owner and name = 'Ringo Club' limit 1;
  if club is null then
    insert into public.clubs (name, owner_id, invite_code)
    values ('Ringo Club', owner, substr(md5(random()::text || clock_timestamp()::text), 1, 8))
    returning id into club;
  end if;
  insert into public.club_members (club_id, user_id, role, display_name)
  select club, p.id, case when p.id = owner then 'owner' else 'member' end,
         left(coalesce(nullif(p.club_name, ''), nullif(p.display_name, ''), 'Perrita'), 20)
  from public.profiles p
  where (p.club_visible and p.club_name is not null) or p.id = owner
  on conflict (club_id, user_id) do nothing;
end $$;
