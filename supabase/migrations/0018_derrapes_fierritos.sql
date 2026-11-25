-- Ringo · compensación de derrapes configurable y automática + fierritos simple/detallado.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.

-- Cómo compensás tus derrapes por defecto: {"mode":"workout|fast|both","sport":"fuerza|any|…","minutes":30,"fastHours":2}
alter table public.profiles add column if not exists derrape_comp jsonb;

-- Cómo registrás fierritos: 'simple' (día y tiempo) o 'detailed' (zonas, repetir el último, usar uno anterior)
alter table public.profiles add column if not exists strength_mode text;
alter table public.profiles drop constraint if exists profiles_strength_mode_check;
alter table public.profiles add constraint profiles_strength_mode_check check (strength_mode in ('simple', 'detailed'));
-- Quien ya cargó zonas sigue en detallado; el resto, simple
update public.profiles p set strength_mode = 'detailed'
  where strength_mode is null
    and exists (select 1 from public.workouts w where w.user_id = p.id and w.type = 'fuerza' and w.details ? 'zones');
update public.profiles set strength_mode = 'simple' where strength_mode is null;
alter table public.profiles alter column strength_mode set default 'simple';

-- Cada derrape guarda con qué se compensa y, si se compensó solo, con qué entreno
alter table public.events add column if not exists comp_detail jsonb;
alter table public.events add column if not exists compensated_by uuid references public.workouts(id) on delete set null;
