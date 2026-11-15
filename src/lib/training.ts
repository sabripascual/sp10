import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/profile";
import { localDate, shiftDate } from "@/lib/fast";
import { eventPhase, type SocialEvent } from "@/lib/events";
import type { DayPlan, EventView, Workout, WorkoutType } from "@/lib/training-types";
export * from "@/lib/training-types";
import { isoDay, weekDates } from "@/lib/week";

export type TrainingData = {
  profile: Profile;
  today: string;
  week: DayPlan[];
  strengthDone: number;
  runMinutes: number;
  events: EventView[]; // relevantes: próximos, de hoy, a compensar y pendientes recientes
};

export async function getTrainingData(profileArg?: Profile): Promise<TrainingData> {
  const profile = profileArg ?? (await getProfile());
  const today = localDate(new Date(), profile.timezone);
  const dates = weekDates(today);
  const supabase = await createClient();

  const [{ data: wData, error: wErr }, { data: eData, error: eErr }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, date, type, minutes, feeling, note, source, status")
      .gte("date", dates[0])
      .lte("date", dates[6])
      .order("created_at"),
    supabase
      .from("events")
      .select("id, name, date, kind, compensation, compensated_at")
      .gte("date", shiftDate(today, -14))
      .order("date"),
  ]);
  if (wErr) throw new Error(`No pude leer los entrenos: ${wErr.message}`);
  if (eErr) throw new Error(`No pude leer los eventos: ${eErr.message}`);

  const workouts = (wData ?? []) as Workout[];
  const week: DayPlan[] = dates.map((date) => {
    const planned = (profile.week_template[String(isoDay(date))] as WorkoutType | undefined) ?? null;
    const dayW = workouts.filter((w) => w.date === date);
    const done = dayW.filter((w) => w.status === "done");
    const skipped = dayW.some((w) => w.status === "skipped");
    return {
      date,
      isoDay: isoDay(date),
      isToday: date === today,
      isFuture: date > today,
      planned,
      workouts: done,
      skipped,
      awaitingConfirm:
        planned !== null && date <= today && !skipped && !done.some((w) => w.type === planned),
    };
  });

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
    events,
  };
}
