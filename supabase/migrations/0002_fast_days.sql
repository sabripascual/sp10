-- SP10 · Etapa 2 · ayuno
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- Una fila por ayuno, identificada por la fecha en que ARRANCA (la noche).
-- Si no hay fila, el ayuno se asume cumplido.

create table if not exists public.fast_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  status text not null default 'ok' check (status in ('ok', 'broken', 'extended', 'event')),
  broken_at timestamptz,
  extra_hours int not null default 0 check (extra_hours between 0 and 8),
  event_id uuid, -- la FK a events se agrega en la Etapa 3
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.fast_days enable row level security;

drop policy if exists "solo la dueña" on public.fast_days;
create policy "solo la dueña" on public.fast_days
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists fast_days_updated_at on public.fast_days;
create trigger fast_days_updated_at
  before update on public.fast_days
  for each row execute function public.set_updated_at();
