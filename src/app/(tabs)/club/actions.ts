"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClubState = { ok?: boolean; error?: string };

async function update(values: { club_visible: boolean; club_name?: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Se cerró la sesión. Volvé a entrar." };
  const { error } = await supabase.from("profiles").update(values).eq("id", userId);
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/club");
  return { ok: true };
}

/** Sumarse al club (o cambiar el nombre) con el nombre que se muestra a las demás. */
export async function joinClub(_prev: ClubState, formData: FormData): Promise<ClubState> {
  const name = String(formData.get("club_name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 20) return { error: "Poné un nombre de 1 a 20 letras." };
  return update({ club_visible: true, club_name: name });
}

export async function leaveClub(): Promise<ClubState> {
  return update({ club_visible: false });
}
