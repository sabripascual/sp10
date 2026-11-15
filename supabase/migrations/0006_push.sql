-- SP10 · Etapa 5 · avisos push
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

-- Avisos activados por tipo (si falta la clave, está activado)
alter table public.profiles add column if not exists notify_prefs jsonb not null default '{}';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Avisos enviados: no repetir el mismo aviso ni la última frase
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  ref text not null, -- fecha o id del evento al que se refiere
  phrase_id int,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);

alter table public.push_subscriptions enable row level security;
drop policy if exists "solo la dueña" on public.push_subscriptions;
create policy "solo la dueña" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notification_log lo escribe solo el cron (service role); la dueña puede leerlo
alter table public.notification_log enable row level security;
drop policy if exists "solo la dueña" on public.notification_log;
create policy "solo la dueña" on public.notification_log
  for select using (auth.uid() = user_id);
