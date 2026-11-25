import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/profile";
import { dayMark, fastWindow, localDate, shiftDate } from "@/lib/fast";
import { loadFastRecords, sinceDate } from "@/lib/fast-data";
import type { BodyCheck } from "@/lib/body";
import { weekStart } from "@/lib/week";
import { firstGradedWeek, levelHistory } from "@/lib/level";
import { profileGoals } from "@/lib/goals";
import { withFallback } from "@/lib/db-fallback";
import {
  compensatedStreak,
  zoneStats,
  fastStreaks,
  strengthWeekStreaks,
  weekSummaries,
  type WeekSummary,
} from "@/lib/progress";

const WEEKS = 26; // historial de niveles; los gráficos usan las últimas 12

export type ProgressData = {
  profile: Profile;
  weeks: WeekSummary[];
  fast: { current: number; max: number };
  strength: { current: number; max: number };
  compensated: { current: number; total: number };
  checks: BodyCheck[];
  zones: ReturnType<typeof zoneStats>;
  level: ReturnType<typeof levelHistory>;
  /** Horas promedio de los ayunos cumplidos de las últimas 4 semanas (null si no hay). */
  fastAvgHours: number | null;
};

export const getProgressData = cache(async function getProgressData(): Promise<ProgressData> {
  const profile = await getProfile();
  const now = new Date();
  const today = localDate(now, profile.timezone);
  const from = shiftDate(weekStart(today), -7 * (WEEKS - 1));
  const supabase = await createClient();

  const [records, wRes, eRes, cRes] = await Promise.all([
    loadFastRecords(profile, shiftDate(today, -400)),
    supabase.from("workouts").select("id, date, type, minutes, status, details").gte("date", from),
    withFallback(supabase.from("events").select("date, compensated_at, compensated_by"), () => supabase.from("events").select("date, compensated_at")),
    supabase.from("body_checks").select("id, date, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, note").order("date"),
  ]);
  for (const r of [wRes, eRes, cRes]) if (r.error) throw new Error(`No pude leer el progreso: ${r.error.message}`);

  const since = sinceDate(profile, records);
  const weeks = weekSummaries({
    now,
    cfg: profile,
    since,
    records,
    workouts: wRes.data ?? [],
    events: eRes.data ?? [],
    goals: (ws) => profileGoals(profile, ws),
    weeks: WEEKS,
  });

  // Horas promedio de los ayunos terminados y cumplidos (últimos 28 días)
  const durations: number[] = [];
  for (let d = shiftDate(today, -28); d < today; d = shiftDate(d, 1)) {
    if (d < since) continue;
    const mark = dayMark(d, now, profile, records, since);
    if (mark !== "ok" && mark !== "extended" && mark !== "event") continue;
    const w = fastWindow(d, profile, records.get(d) ?? null);
    if (w.end > now) continue;
    durations.push((w.end.getTime() - w.start.getTime()) / 3_600_000);
  }
  const fastAvgHours = durations.length ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : null;

  return {
    profile,
    fastAvgHours,
    weeks,
    fast: fastStreaks(now, profile, records, since),
    strength: strengthWeekStreaks(weeks),
    compensated: compensatedStreak(eRes.data ?? [], today),
    checks: (cRes.data ?? []) as BodyCheck[],
    zones: zoneStats(wRes.data ?? []),
    level: levelHistory(weeks, firstGradedWeek(since)),
  };
});
