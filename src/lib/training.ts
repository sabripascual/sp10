import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/profile";
import { localDate, shiftDate } from "@/lib/fast";
import { eventPhase, type SocialEvent } from "@/lib/events";
import { autoCompensate } from "@/lib/compensation-data";
import type { DayPlan, EventView, RecentStrength, Workout } from "@/lib/training-types";
export * from "@/lib/training-types";
import { isoDay, weekDates } from "@/lib/week";

export type TrainingData = {
  profile: Profile;
  today: string;
  week: DayPlan[];
  strengthDone: number;
  runMinutes: number;
  runKcal: number;
  weightKg: number; // último peso cargado (para estimar kcal); 65 si no hay
  events: EventView[]; // relevantes: próximos, de hoy, a compensar y pendientes recientes
  /** Últimos fierritos con detalle (para "Repetir el último" / "Usar uno anterior"). */
  recentStrength: RecentStrength[];
};

export async function getTrainingData(profileArg?: Profile): Promise<TrainingData> {
  const profile = profileArg ?? (await getProfile());
  const today = localDate(new Date(), profile.timezone);
  const dates = weekDates(today);
  const supabase = await createClient();
  // Antes de leer: marca compensados los derrapes que ya se cumplieron (ej. el ayuno extra terminó solo)
  await autoCompensate(supabase, profile);

  const [{ data: wData, error: wErr }, { data: eData, error: eErr }, { data: recent }, { data: lastWeight }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, date, type, minutes, feeling, note, source, status, details")
      .gte("date", dates[0])
      .lte("date", dates[6])
      .order("created_at"),
    supabase
      .from("events")
      .select("id, name, date, kind, compensation, compensated_at, comp_detail, compensated_by")
      .gte("date", shiftDate(today, -14))
      .order("date")
      .then(async (r) =>
        // Si todavía no se corrió la migración 0018, sin las columnas nuevas
        r.error?.message.includes("comp_")
          ? await supabase.from("events").select("id, name, date, kind, compensation, compensated_at").gte("date", shiftDate(today, -14)).order("date")
          : r,
      ),
    supabase
      .from("workouts")
      .select("date, minutes, details")
      .eq("type", "fuerza")
      .eq("status", "done")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("body_checks")
      .select("weight_kg")
      .not("weight_kg", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (wErr) throw new Error(`No pude leer los entrenos: ${wErr.message}`);
  if (eErr) throw new Error(`No pude leer los eventos: ${eErr.message}`);

  const workouts = (wData ?? []) as Workout[];
  const week: DayPlan[] = dates.map((date) => ({
    date,
    isoDay: isoDay(date),
    isToday: date === today,
    isFuture: date > today,
    workouts: workouts.filter((w) => w.date === date && w.status === "done"),
  }));

  const doneAll = workouts.filter((w) => w.status === "done");
  const events = ((eData ?? []) as SocialEvent[])
    .map((e) => ({ ...e, phase: eventPhase(e, today) }))
    .filter((e) => e.phase !== "compensated" || e.date >= shiftDate(today, -2));

  return {
    profile,
    today,
    week,
    strengthDone: doneAll.filter((w) => w.type === "fuerza").length,
    runMinutes: doneAll.filter((w) => w.type === "correr").reduce((a, w) => a + (w.minutes ?? 0), 0),
    runKcal: doneAll.filter((w) => w.type === "correr").reduce((a, w) => a + (w.details?.kcal ?? 0), 0),
    weightKg: lastWeight?.weight_kg ? Number(lastWeight.weight_kg) : 65,
    events,
    recentStrength: ((recent ?? []) as RecentStrength[]).filter((r) => r.details?.zones && Object.keys(r.details.zones).length).slice(0, 6),
  };
}
