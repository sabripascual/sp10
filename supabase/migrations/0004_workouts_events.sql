-- SP10 · Etapa 3 · entrenos y eventos
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  type text not null check (type in ('futbol', 'fuerza', 'correr', 'padel', 'otro')),
  minutes int check (minutes between 1 and 600),
  feeling text check (feeling in ('dificil', 'bien', 'excelente')),
  note text,
  source text not null default 'manual' check (source in ('manual', 'template')),
  status text not null default 'done' check (status in ('done', 'skipped')), -- skipped = "no fui"
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_date on public.workouts (user_id, date);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  date date not null,
  kind text not null check (kind in ('cena', 'tragos', 'ambos')),
  compensation text not null check (compensation in ('fast', 'workout', 'both')),
  compensated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists events_user_date on public.events (user_id, date);

-- RLS
alter table public.workouts enable row level security;
drop policy if exists "solo la dueña" on public.workouts;
create policy "solo la dueña" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.events enable row level security;
drop policy if exists "solo la dueña" on public.events;
create policy "solo la dueña" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- El ayuno de la noche del evento apunta al evento
alter table public.fast_days drop constraint if exists fast_days_event_id_fkey;
alter table public.fast_days
  add constraint fast_days_event_id_fkey foreign key (event_id) references public.events (id) on delete set null;
