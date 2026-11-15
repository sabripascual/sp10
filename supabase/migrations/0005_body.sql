-- SP10 · Etapa 4 · cuerpo: controles, medidas y fotos privadas
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

-- Fecha del primer control (después, cada 14 días desde el último)
alter table public.profiles add column if not exists body_check_start date;
update public.profiles set body_check_start = '2026-11-16' where body_check_start is null;

create table if not exists public.body_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 2) check (weight_kg between 20 and 300),
  waist_cm numeric(5, 1) check (waist_cm between 20 and 250),
  hip_cm numeric(5, 1) check (hip_cm between 20 and 250),
  chest_cm numeric(5, 1) check (chest_cm between 20 and 250),
  arm_cm numeric(5, 1) check (arm_cm between 5 and 100),
  thigh_cm numeric(5, 1) check (thigh_cm between 10 and 150),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  check_id uuid not null references public.body_checks (id) on delete cascade,
  angle text not null check (angle in ('front', 'side', 'back')),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (check_id, angle)
);

alter table public.body_checks enable row level security;
drop policy if exists "solo la dueña" on public.body_checks;
create policy "solo la dueña" on public.body_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.body_photos enable row level security;
drop policy if exists "solo la dueña" on public.body_photos;
create policy "solo la dueña" on public.body_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket privado: {user_id}/{check_id}/{angle}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('body-photos', 'body-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false;

drop policy if exists "fotos: solo la dueña" on storage.objects;
create policy "fotos: solo la dueña" on storage.objects
  for all to authenticated
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);
