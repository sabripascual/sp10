"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { ok?: boolean; error?: string };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const fastStart = String(formData.get("fast_start") ?? "");
  const fastEnd = String(formData.get("fast_end") ?? "");
  const strengthGoal = Number(formData.get("strength_goal"));
  const hideWeight = formData.get("hide_weight") === "on";
  const nicknames = String(formData.get("nicknames") ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!TIME_RE.test(fastStart) || !TIME_RE.test(fastEnd))
    return { error: "Revisá los horarios del ayuno." };
  if (!Number.isInteger(strengthGoal) || strengthGoal < 1 || strengthGoal > 7)
    return { error: "La meta de fuerza va de 1 a 7 por semana." };
  if (nicknames.length === 0) return { error: "Dejame al menos un apodo." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Se cerró la sesión. Volvé a entrar." };

  const { error } = await supabase
    .from("profiles")
    .update({
      fast_start: fastStart,
      fast_end: fastEnd,
      strength_goal: strengthGoal,
      hide_weight: hideWeight,
      nicknames,
    })
    .eq("id", user.id);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true };
}
