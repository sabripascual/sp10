// Lógica pura de progreso: resúmenes semanales y rachas.
import { dayMark, localDate, shiftDate, type FastConfig, type FastDay } from "@/lib/fast";
import { eventPhase } from "@/lib/events";
import { weekStart } from "@/lib/week";

type W = { date: string; type: string; minutes: number | null; status: string };
type E = { date: string; compensated_at: string | null };

export type WeekSummary = {
  weekStart: string;
  isCurrent: boolean;
  strength: number;
  strengthGoal: number;
  fastOk: number;
  fastDays: number; // días contados (los que ya terminaron, desde el inicio)
  compensated: number;
  pending: number;
  runMinutes: number;
};

export function weekSummaries(input: {
  now: Date;
  cfg: FastConfig;
  since: string;
  records: Map<string, FastDay>;
  workouts: W[];
  events: E[];
  strengthGoal: number;
  weeks: number;
}): WeekSummary[] {
  const today = localDate(input.now, input.cfg.timezone);
  const current = weekStart(today);
  const out: WeekSummary[] = [];
  for (let i = input.weeks - 1; i >= 0; i--) {
    const ws = shiftDate(current, -7 * i);
    const days = Array.from({ length: 7 }, (_, d) => shiftDate(ws, d));
    const marks = days.map((d) => dayMark(d, input.now, input.cfg, input.records, input.since));
    const counted = marks.filter((m) => m !== "none" && m !== "pending");
    const inWeek = <T extends { date: string }>(x: T) => x.date >= ws && x.date <= days[6];
    const done = input.workouts.filter((w) => inWeek(w) && w.status === "done");
    const evs = input.events.filter(inWeek);
    out.push({
      weekStart: ws,
      isCurrent: ws === current,
      strength: done.filter((w) => w.type === "fuerza").length,
      strengthGoal: input.strengthGoal,
      fastOk: counted.filter((m) => m !== "broken").length,
      fastDays: counted.length,
      compensated: evs.filter((e) => e.compensated_at).length,
      pending: evs.filter((e) => eventPhase(e, today) === "pending").length,
      runMinutes: done.filter((w) => w.type === "correr").reduce((a, w) => a + (w.minutes ?? 0), 0),
    });
  }
  return out;
}

export function summaryText(s: WeekSummary) {
  const parts = [`${s.strength}/${s.strengthGoal} fierritos`, `${s.fastOk}/${s.fastDays} ayuno`];
  if (s.compensated) parts.push(`${s.compensated} ${s.compensated === 1 ? "evento compensado" : "eventos compensados"}`);
  if (s.pending) parts.push(`${s.pending} pendiente${s.pending === 1 ? "" : "s"}`);
  if (s.runMinutes) parts.push(`${s.runMinutes} min corridos`);
  return parts.join(", ");
}

/** Racha actual y máxima de ayunos cumplidos (el en curso no suma, uno cortado corta). */
export function fastStreaks(now: Date, cfg: FastConfig, records: Map<string, FastDay>, since: string) {
  const today = localDate(now, cfg.timezone);
  let run = 0;
  let max = 0;
  for (let d = since; d <= today; d = shiftDate(d, 1)) {
    const m = dayMark(d, now, cfg, records, since);
    if (m === "pending") continue;
    run = m === "broken" ? 0 : run + 1;
    max = Math.max(max, run);
  }
  return { current: run, max };
}

/**
 * Semanas seguidas con la meta de fuerza cumplida. La semana en curso suma
 * solo si ya la cumpliste; si no, no corta (todavía hay tiempo).
 */
export function strengthWeekStreaks(weeks: WeekSummary[]) {
  let run = 0;
  let max = 0;
  let current = 0;
  for (const w of weeks) {
    const met = w.strength >= w.strengthGoal;
    if (w.isCurrent) {
      current = met ? run + 1 : run;
      max = Math.max(max, current);
      break;
    }
    run = met ? run + 1 : 0;
    max = Math.max(max, run);
    current = run;
  }
  return { current, max };
}

/** Eventos compensados: total y seguidos (los que todavía están en sus 48 h no cortan). */
export function compensatedStreak(events: E[], today: string) {
  const past = events
    .filter((e) => e.date < today)
    .map((e) => ({ ...e, phase: eventPhase(e, today) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  let run = 0;
  for (const e of past) {
    if (e.phase === "compensated") run++;
    else if (e.phase === "pending") run = 0;
  }
  return { current: run, total: past.filter((e) => e.phase === "compensated").length };
}

// ── Fierritos por zona y su relación con las medidas ───────────────────────
type ZoneKey = "brazos" | "core" | "piernas";
type ZW = { exercises: number; reps: number; rounds: number };
type FW = { type: string; status: string; details?: { zones?: Partial<Record<ZoneKey, ZW>> } | null };

/** Medida que acompaña a cada zona. */
export const ZONE_MEASURE: Record<ZoneKey, { key: "arm_cm" | "waist_cm" | "thigh_cm"; label: string }> = {
  brazos: { key: "arm_cm", label: "brazo" },
  core: { key: "waist_cm", label: "cintura" },
  piernas: { key: "thigh_cm", label: "pierna" },
};

export function zoneStats(workouts: FW[]) {
  const zones: ZoneKey[] = ["brazos", "core", "piernas"];
  const stats = zones.map((zone) => {
    let sessions = 0;
    let rounds = 0;
    let reps = 0;
    for (const w of workouts) {
      const z = w.type === "fuerza" && w.status === "done" ? w.details?.zones?.[zone] : undefined;
      if (!z) continue;
      sessions++;
      rounds += z.rounds;
      reps += z.exercises * z.reps * z.rounds;
    }
    return { zone, sessions, rounds, reps };
  });
  const top = [...stats].sort((a, b) => b.sessions - a.sessions || b.reps - a.reps)[0];
  return { stats, top: top.sessions > 0 ? top.zone : null };
}

/** Cambio de una medida entre el primer y el último control que la tienen. */
export function measureChange<T extends { date: string } & Record<string, unknown>>(checks: T[], key: string) {
  const vals = checks
    .filter((c) => c[key] !== null && c[key] !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => Number(c[key]));
  if (vals.length < 2) return null;
  return Math.round((vals.at(-1)! - vals[0]) * 10) / 10;
}
