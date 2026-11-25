// Lógica pura de progreso: resúmenes semanales y rachas.
import { dayMark, localDate, shiftDate, type FastConfig, type FastDay } from "@/lib/fast";
import { eventPhase } from "@/lib/events";
import { weekStart } from "@/lib/week";
import { goalProgress, goalsText, type Goals } from "@/lib/goals";

type W = { id?: string; date: string; type: string; minutes: number | null; status: string; details?: { kcal?: number } | null };
type E = { date: string; compensated_at: string | null; compensated_by?: string | null };

/** Un entreno que compensó un derrape cuenta la mitad para la semana ideal. */
export const COMPENSATOR_WEIGHT = 0.5;

export type WeekSummary = {
  weekStart: string;
  isCurrent: boolean;
  strength: number;
  strengthGoal: number;
  fastOk: number;
  fastDays: number; // días contados (los que ya terminaron, desde el inicio)
  compensated: number;
  missed: number; // derrapes que cerraron la semana sin compensar
  runMinutes: number;
  otherWorkouts: number; // carrera, fútbol, pádel, etc. (todo lo que no es fierritos)
  byType: Record<string, number>; // entrenos hechos por tipo (el que compensó un derrape cuenta medio)
  sessionsByType: Record<string, number>; // sesiones reales por tipo
  minutesByType: Record<string, number>; // minutos por tipo
  runKcal: number; // kcal aproximadas de carrera
  goals: Goals; // objetivo semanal (el de hoy, aplicado a todas las semanas)
};

export function weekSummaries(input: {
  now: Date;
  cfg: FastConfig;
  since: string;
  records: Map<string, FastDay>;
  workouts: W[];
  events: E[];
  /** Objetivos (los mismos para todas las semanas, o según la semana). */
  goals: Goals | ((weekStart: string) => Goals);
  weeks: number;
}): WeekSummary[] {
  const today = localDate(input.now, input.cfg.timezone);
  const current = weekStart(today);
  const compensators = new Set(input.events.map((e) => e.compensated_by).filter(Boolean) as string[]);
  const out: WeekSummary[] = [];
  for (let i = input.weeks - 1; i >= 0; i--) {
    const ws = shiftDate(current, -7 * i);
    const days = Array.from({ length: 7 }, (_, d) => shiftDate(ws, d));
    const marks = days.map((d) => dayMark(d, input.now, input.cfg, input.records, input.since));
    const counted = marks.filter((m) => m !== "none" && m !== "pending");
    const inWeek = <T extends { date: string }>(x: T) => x.date >= ws && x.date <= days[6];
    const done = input.workouts.filter((w) => inWeek(w) && w.status === "done");
    const evs = input.events.filter(inWeek);
    const goalsAt = typeof input.goals === "function" ? input.goals(ws) : input.goals;
    const sessionsByType: Record<string, number> = {};
    const minutesByType: Record<string, number> = {};
    for (const w of done) {
      sessionsByType[w.type] = (sessionsByType[w.type] ?? 0) + 1;
      minutesByType[w.type] = (minutesByType[w.type] ?? 0) + (w.minutes ?? 0);
    }
    const byType: Record<string, number> = {};
    for (const w of done) byType[w.type] = (byType[w.type] ?? 0) + (w.id && compensators.has(w.id) ? COMPENSATOR_WEIGHT : 1);
    out.push({
      weekStart: ws,
      isCurrent: ws === current,
      strength: done.filter((w) => w.type === "fuerza").length,
      strengthGoal: goalsAt.fuerza ?? 0,
      fastOk: counted.filter((m) => m !== "broken").length,
      fastDays: counted.length,
      compensated: evs.filter((e) => e.compensated_at).length,
      missed: evs.filter((e) => eventPhase(e, today) === "missed").length,
      runMinutes: done.filter((w) => w.type === "correr").reduce((a, w) => a + (w.minutes ?? 0), 0),
      otherWorkouts: done.filter((w) => w.type !== "fuerza").length,
      byType,
      sessionsByType,
      minutesByType,
      runKcal: done.filter((w) => w.type === "correr").reduce((a, w) => a + (w.details?.kcal ?? 0), 0),
      goals: goalsAt,
    });
  }
  return out;
}

/** Avance del objetivo semanal de una semana. */
export function weekGoals(s: WeekSummary) {
  return goalProgress(s.goals, { fastOk: s.fastOk, byType: s.byType });
}

export function summaryText(s: WeekSummary) {
  const g = weekGoals(s);
  const parts = [`${g.pct}% de tu semana`, goalsText(g.items)];
  if (s.compensated) parts.push(`${s.compensated} ${s.compensated === 1 ? "derrape compensado" : "derrapes compensados"}`);
  if (s.missed) parts.push(`${s.missed} sin compensar`);
  // Solo lo que es parte de tu rutina (semana ideal)
  if (s.runMinutes && (s.goals.correr ?? 0) > 0) parts.push(`${s.runMinutes} min corridos`);
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
    const met = w.strengthGoal > 0 && w.strength >= w.strengthGoal;
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

/** Derrapes compensados: total y seguidos (los que todavía se pueden compensar no cortan). */
export function compensatedStreak(events: E[], today: string) {
  const past = events
    .filter((e) => e.date < today)
    .map((e) => ({ ...e, phase: eventPhase(e, today) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  let run = 0;
  for (const e of past) {
    if (e.phase === "compensated") run++;
    else if (e.phase === "missed") run = 0;
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

// ── Progreso según la semana ideal ───────────────────────────────────────

type Met = { met: boolean; isCurrent: boolean; counts: boolean };

/** Semanas seguidas cumpliendo algo. La semana en curso suma solo si ya se cumplió (si no, no corta). */
function metStreak(list: Met[]) {
  let run = 0;
  let max = 0;
  let current = 0;
  for (const x of list) {
    if (x.isCurrent) {
      current = x.met ? run + 1 : run;
      max = Math.max(max, current);
      break;
    }
    if (!x.counts) continue; // semana sin ese objetivo: no suma ni corta
    run = x.met ? run + 1 : 0;
    max = Math.max(max, run);
    current = run;
  }
  return { current, max };
}

/** Constancia general: % de la semana ideal por semana, racha al 100 %, promedio de las últimas 4 y mejor semana. */
export function idealStats(weeks: WeekSummary[]) {
  const series = weeks.map((w) => ({ weekStart: w.weekStart, isCurrent: w.isCurrent, pct: weekGoals(w).pct, hasGoals: weekGoals(w).items.length > 0 }));
  const closed = series.filter((s) => !s.isCurrent && s.hasGoals);
  const last4 = closed.slice(-4);
  return {
    series,
    streak: metStreak(series.map((s) => ({ met: s.pct >= 100, isCurrent: s.isCurrent, counts: s.hasGoals }))),
    avg4: last4.length ? Math.round(last4.reduce((a, s) => a + s.pct, 0) / last4.length) : null,
    best: closed.length ? Math.max(...closed.map((s) => s.pct)) : null,
  };
}

/** Un objetivo semana a semana: hecho vs. meta (la de cada semana) y racha cumpliéndolo. */
export function goalSeries(weeks: WeekSummary[], key: string) {
  const series = weeks.map((w) => ({
    weekStart: w.weekStart,
    isCurrent: w.isCurrent,
    done: key === "ayuno" ? w.fastOk : (w.byType[key] ?? 0),
    sessions: key === "ayuno" ? w.fastOk : (w.sessionsByType[key] ?? 0),
    minutes: w.minutesByType[key] ?? 0,
    target: (w.goals as Record<string, number | undefined>)[key] ?? 0,
  }));
  return {
    series,
    streak: metStreak(series.map((s) => ({ met: s.target > 0 && s.done >= s.target, isCurrent: s.isCurrent, counts: s.target > 0 }))),
  };
}

/** Entrenos fuera de la semana ideal (últimas `n` semanas): "2 de tenis, 1 de trekking". */
export function otherWorkouts(weeks: WeekSummary[], goalKeys: string[], n = 4) {
  const totals: Record<string, number> = {};
  for (const w of weeks.slice(-n))
    for (const [t, c] of Object.entries(w.sessionsByType)) if (!goalKeys.includes(t)) totals[t] = (totals[t] ?? 0) + c;
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}
