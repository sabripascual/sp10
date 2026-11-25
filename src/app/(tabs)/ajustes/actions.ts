"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { favoritesOf } from "@/lib/training-types";
import {
  GOAL_KEYS,
  MAX_PER_GOAL,
  goalsHistory,
  goalsOf,
  profileGoals,
  sameGoals,
  type Goals,
  type GoalsEntry,
} from "@/lib/goals";
import { getProfile } from "@/lib/profile";
import { localDate, shiftDate } from "@/lib/fast";
import { weekStart } from "@/lib/week";
import { compPrefsOf, type CompPrefs } from "@/lib/events";

export type SettingsState = { ok?: boolean; error?: string; info?: string };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const fastStart = String(formData.get("fast_start") ?? "");
  const fastEnd = String(formData.get("fast_end") ?? "");
  const fastingEnabled = formData.get("fasting_enabled") === "on";
  const strengthMode =
    formData.get("strength_mode") === "detailed" ? "detailed" : "simple";
  let derrapeComp: CompPrefs | null = null;
  try {
    derrapeComp = compPrefsOf(
      JSON.parse(String(formData.get("derrape_comp") ?? "null")),
      fastingEnabled,
    );
  } catch {
    derrapeComp = null;
  }
  let goals: Goals = {};
  try {
    const raw = JSON.parse(
      String(formData.get("weekly_goals") ?? "{}"),
    ) as Record<string, unknown>;
    for (const k of GOAL_KEYS) {
      const n = Number(raw[k]);
      if (k === "ayuno" && !fastingEnabled) continue;
      if (Number.isInteger(n) && n > 0) goals[k] = Math.min(n, MAX_PER_GOAL);
    }
  } catch {
    goals = {};
  }
  const hideWeight = formData.get("hide_weight") === "on";
  const favoriteSports = favoritesOf(
    String(formData.get("favorite_sports") ?? "").split(","),
  );
  const bodyStart = String(formData.get("body_check_start") ?? "");
  if (bodyStart && !/^\d{4}-\d{2}-\d{2}$/.test(bodyStart))
    return { error: "Revisá la fecha del primer control." };
  const nicknames = String(formData.get("nicknames") ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!TIME_RE.test(fastStart) || !TIME_RE.test(fastEnd))
    return { error: "Revisá los horarios del ayuno." };
  if (Object.keys(goals).length === 0)
    return { error: "Elegí al menos un objetivo para tu semana." };
  if (nicknames.length === 0) return { error: "Dejame al menos un apodo." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Se cerró la sesión. Volvé a entrar." };

  // Semana ideal: la primera vez se aplica ya; después, los cambios valen desde el lunes que viene
  // (así nadie baja la meta a mitad de semana para subir en el ranking).
  const profile = await getProfile();
  const ws = weekStart(localDate(new Date(), profile.timezone));
  const nextMonday = shiftDate(ws, 7);
  const firstTime = !profile.weekly_goals && goalsHistory(profile).length === 0;
  let history: GoalsEntry[] = goalsHistory(profile);
  let info: string | undefined;
  if (firstTime) history = [{ from: "2000-01-01", goals }];
  else {
    if (!history.length)
      history = [
        {
          from: "2000-01-01",
          goals: goalsOf(profile.weekly_goals, profile.strength_goal),
        },
      ];
    const now = profileGoals({ ...profile, fasting_enabled: true }, ws);
    history = history.filter((e) => e.from <= ws); // un cambio nuevo reemplaza al que estaba programado
    if (!sameGoals(now, goals)) {
      history.push({ from: nextMonday, goals });
      info = `Tus objetivos nuevos arrancan el lunes ${Number(nextMonday.slice(8))}/${Number(nextMonday.slice(5, 7))}. Esta semana sigue con los de antes 😏`;
    }
  }

  const update = (withHistory: boolean) =>
    supabase
      .from("profiles")
      .update({
        ...(withHistory ? { goals_history: history } : {}),
        fast_start: fastStart,
        fast_end: fastEnd,
        weekly_goals: goals,
        fasting_enabled: fastingEnabled,
        strength_mode: strengthMode,
        ...(derrapeComp ? { derrape_comp: derrapeComp } : {}),
        // la meta de fierritos de siempre sigue al objetivo (si sacaste fierritos, queda la anterior)
        ...(goals.fuerza && (firstTime || !withHistory)
          ? { strength_goal: goals.fuerza }
          : {}),
        hide_weight: hideWeight,
        nicknames,
        body_check_start: bodyStart || null,
        favorite_sports: favoriteSports,
      })
      .eq("id", userId);
  let { error } = await update(true);
  // Si todavía no se corrió la migración 0019, se guarda como antes (se aplica ya)
  if (error?.message.includes("goals_history")) {
    ({ error } = await update(false));
    info = undefined;
  }
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, info };
}
