"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Guarda la foto recién subida ({user_id}/…jpg) y borra la anterior. path = null la quita. */
export async function setAvatar(path: string | null): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Se cerró la sesión. Volvé a entrar." };
  if (path !== null && !new RegExp(`^${userId}/[a-z0-9-]+\\.jpg$`).test(path)) return { error: "Foto inválida." };

  const { data: prev } = await supabase.from("profiles").select("avatar_path").eq("id", userId).single();
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  if (prev?.avatar_path && prev.avatar_path !== path) await supabase.storage.from("avatars").remove([prev.avatar_path]);

  revalidatePath("/", "layout");
  return { ok: true };
}
