-- Ringo · foto de perfil (se ve en "¿Cómo venís?", arriba a la derecha y en el Ringo Club).
-- Bucket público con nombre de archivo al azar: {user_id}/{aleatorio}.jpg. Solo la dueña sube o borra lo suyo.
-- (Las fotos del cuerpo siguen en su bucket privado; esto es solo la foto de perfil.)
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
alter table public.profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];

drop policy if exists "avatar: solo la dueña" on storage.objects;
create policy "avatar: solo la dueña" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
