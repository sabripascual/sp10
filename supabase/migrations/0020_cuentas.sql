-- Ringo · cuentas: registro con aprobación, WhatsApp de recuperación, pedidos de contraseña.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

-- Rol nuevo: 'pending' (se registró sola y espera que la admin la apruebe)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user', 'disabled', 'pending'));

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists whatsapp text;
-- Después de un reseteo de la admin: al entrar se le ofrece elegir su contraseña
alter table public.profiles add column if not exists must_change_password boolean not null default false;

-- Pedidos de "olvidé mi contraseña" (solo los lee y escribe el service role: RLS sin políticas)
create table if not exists public.password_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  whatsapp text not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.password_requests enable row level security;
create index if not exists password_requests_status on public.password_requests (status, created_at desc);
