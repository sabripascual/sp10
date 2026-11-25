import { SUPABASE_URL } from "@/lib/supabase/env";

/** URL pública de la foto de perfil (el nombre del archivo es aleatorio), o null si no tiene. */
export function avatarUrl(path: string | null | undefined) {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}
