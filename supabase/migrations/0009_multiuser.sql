-- Ringo · multiusuario: roles admin / user / disabled
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- Cada cuenta ve solo sus datos (RLS en todas las tablas, ya estaba).
-- Las cuentas nuevas nacen como 'user'; la tuya (la que ya existe) queda 'admin'.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user', 'disabled'));
alter table public.profiles alter column role set default 'user';

-- Nadie puede cambiarse el rol a sí misma desde la app (solo el panel admin, con service role)
create or replace function public.protect_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

-- Ver quién es admin
select u.email, p.role from public.profiles p join auth.users u on u.id = p.id;
