"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { favoritesOf } from "@/lib/training-types";

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
  const favoriteSports = favoritesOf(String(formData.get("favorite_sports") ?? "").split(","));
  const bodyStart = String(formData.get("body_check_start") ?? "");
  if (bodyStart && !/^\d{4}-\d{2}-\d{2}$/.test(bodyStart)) return { error: "Revisá la fecha del primer control." };
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
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Se cerró la sesión. Volvé a entrar." };

  const { error } = await supabase
    .from("profiles")
    .update({
      fast_start: fastStart,
      fast_end: fastEnd,
      strength_goal: strengthGoal,
      hide_weight: hideWeight,
      nicknames,
      body_check_start: bodyStart || null,
      favorite_sports: favoriteSports,
    })
    .eq("id", userId);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true };
}
