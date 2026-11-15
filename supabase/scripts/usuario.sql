-- SP10 · alta de usuaria o cambio de contraseña por SQL
-- Uso: Supabase → SQL Editor. Reemplazá TU_EMAIL y TU_CONTRASEÑA ANTES de correr.
-- ⚠️ No guardes este archivo con datos reales ni lo subas a GitHub.
-- ⚠️ El SQL Editor guarda historial: después de correrlo, borrá la consulta.
--
-- Corré SOLO la parte que necesites (seleccioná el bloque y tocá Run).

-- ─────────────────────────────────────────────────────────────
-- A) CREAR la usuaria (si no existe)
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_email text := 'TU_EMAIL';
  v_password text := 'TU_CONTRASEÑA';
  v_id uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = lower(v_email)) then
    raise exception 'Ya existe un usuario con %, usá la parte B para cambiar la contraseña', v_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    lower(v_email), extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), '{"provider": "email", "providers": ["email"]}', '{}',
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(v_email), 'email_verified', true),
    'email', v_id::text,
    now(), now(), now()
  );
  -- El perfil (public.profiles) lo crea solo el trigger on_auth_user_created.
end $$;

-- ─────────────────────────────────────────────────────────────
-- B) CAMBIAR la contraseña de una usuaria existente
-- ─────────────────────────────────────────────────────────────
update auth.users
set encrypted_password = extensions.crypt('TU_CONTRASEÑA_NUEVA', extensions.gen_salt('bf')),
    updated_at = now()
where email = lower('TU_EMAIL');

-- ─────────────────────────────────────────────────────────────
-- C) VERIFICAR
-- ─────────────────────────────────────────────────────────────
select u.email, u.email_confirmed_at is not null as confirmada, p.role
from auth.users u
left join public.profiles p on p.id = u.id;
