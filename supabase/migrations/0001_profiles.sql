-- SP10 · Etapa 1 · perfiles
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  nicknames text[] not null default array['crack', 'reina', 'bebita', 'diosa', 'amorrrr'],
  fast_start time not null default '19:00',
  fast_end time not null default '11:00',
  strength_goal int not null default 3 check (strength_goal between 1 and 7),
  hide_weight boolean not null default false,
  timezone text not null default 'America/Argentina/Tucuman',
  -- día ISO (1 = lunes ... 7 = domingo) → actividad sugerida
  week_template jsonb not null default '{"1": "futbol", "2": "futbol", "4": "futbol", "6": "futbol"}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: cada fila solo la ve y la toca su dueña
alter table public.profiles enable row level security;

drop policy if exists "solo la dueña" on public.profiles;
create policy "solo la dueña" on public.profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- updated_at automático (reutilizable en las otras tablas)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crear el perfil solo cuando se crea un usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si el usuario ya existía antes de correr este script
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
