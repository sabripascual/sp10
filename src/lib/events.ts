// Lógica pura de eventos y compensación.
import { baseDurationMinutes, fastWindow, OVERTIME_MS, shiftDate, type FastConfig, type FastDay } from "@/lib/fast";
import { weekStart } from "@/lib/week";

export type EventKind = "cena" | "tragos" | "ambos";
export type Compensation = "fast" | "workout" | "both";

export type SocialEvent = {
  id: string;
  name: string;
  date: string;
  kind: EventKind;
  compensation: Compensation;
  compensated_at: string | null;
  /** Detalle de la compensación (null en los derrapes viejos). */
  comp_detail?: CompDetail | null;
  /** Entreno que lo compensó solo (cuenta la mitad para la semana ideal). */
  compensated_by?: string | null;
};

/**
 * upcoming   → falta más de un día
 * tomorrow   → es mañana: hoy toca "preparar"
 * today      → es hoy
 * compensate → ya pasó: toca compensar hasta el domingo de esa semana
 *              (si fue un domingo, hasta el lunes)
 * missed     → cerró la semana sin compensar: queda como no compensado (ya no se puede tildar)
 * compensated
 */
export type EventPhase = "upcoming" | "tomorrow" | "today" | "compensate" | "missed" | "compensated";

/** Último día para compensar: el domingo de la semana del derrape (o el lunes, si fue domingo). */
export function compensateDeadline(date: string) {
  const sunday = shiftDate(weekStart(date), 6);
  return sunday > date ? sunday : shiftDate(date, 1);
}

export function eventPhase(ev: Pick<SocialEvent, "date" | "compensated_at">, today: string): EventPhase {
  if (ev.compensated_at) return "compensated";
  if (today < shiftDate(ev.date, -1)) return "upcoming";
  if (today === shiftDate(ev.date, -1)) return "tomorrow";
  if (today === ev.date) return "today";
  if (today <= compensateDeadline(ev.date)) return "compensate";
  return "missed";
}

export const KIND_LABEL: Record<EventKind, string> = { cena: "Cena", tragos: "Tragos", ambos: "Cena y tragos" };

export const COMPENSATION_LABEL: Record<Compensation, string> = {
  fast: "+2 h de ayuno",
  workout: "Entreno extra",
  both: "Ayuno +2 h y entreno",
};

/** Texto de la tarea del día siguiente. */
export function compensationTask(c: Compensation, firstMeal: string) {
  const fast = `primera comida a las ${firstMeal}`;
  const workout = "fierritos o 30 min de carrera";
  return c === "fast" ? `Hoy ${fast}.` : c === "workout" ? `Hoy toca ${workout}.` : `Hoy ${fast} y ${workout}.`;
}

// ── Compensación configurable y automática ────────────────────────────────

/** Cómo se compensa: deporte (o "any") con minutos mínimos, y/o horas extra de ayuno. */
export type CompDetail = { sport: string; minutes: number; fastHours: number };
export type CompPrefs = { mode: Compensation } & CompDetail;

export const COMP_MINUTES = [0, 30, 45, 60, 90];
export const COMP_FAST_HOURS = [1, 2, 3];
export const DEFAULT_COMP: CompPrefs = { mode: "workout", sport: "fuerza", minutes: 30, fastHours: 2 };

/** Preferencia de compensación del perfil, válida (sin ayuno → solo entreno). */
export function compPrefsOf(raw: unknown, fasting = true): CompPrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CompPrefs>;
  const mode: Compensation = fasting && (r.mode === "fast" || r.mode === "both") ? r.mode : "workout";
  return {
    mode,
    sport: typeof r.sport === "string" && r.sport ? r.sport : DEFAULT_COMP.sport,
    minutes: COMP_MINUTES.includes(Number(r.minutes)) ? Number(r.minutes) : DEFAULT_COMP.minutes,
    fastHours: COMP_FAST_HOURS.includes(Number(r.fastHours)) ? Number(r.fastHours) : DEFAULT_COMP.fastHours,
  };
}

type CompWorkout = { id: string; date: string; type: string; minutes: number | null; status: string };
type CompEvent = Pick<SocialEvent, "date" | "compensation" | "compensated_at"> & { comp_detail?: CompDetail | null };

/** ¿Este entreno sirve para compensar ese derrape? (los viejos sin detalle: fierritos o 30 min de carrera) */
export function workoutCompensates(ev: CompEvent, w: CompWorkout) {
  if (w.status !== "done" || w.date <= ev.date || w.date > compensateDeadline(ev.date)) return false;
  const d = ev.comp_detail;
  if (!d) return w.type === "fuerza" || (w.type === "correr" && (w.minutes ?? 0) >= 30);
  if (d.sport !== "any" && w.type !== d.sport) return false;
  return d.minutes === 0 || (w.minutes ?? 0) >= d.minutes;
}

/**
 * Qué falta para compensar un derrape. `fastDone` = el ayuno de esa noche llegó a sus horas (con las extra).
 * `used` = entrenos que ya compensaron otro derrape (no se usan dos veces).
 */
export function compensationCheck(ev: CompEvent, workouts: CompWorkout[], fastDone: boolean, used = new Set<string>()) {
  const needWorkout = ev.compensation !== "fast";
  const needFast = ev.compensation !== "workout";
  const workout = needWorkout ? (workouts.find((w) => !used.has(w.id) && workoutCompensates(ev, w)) ?? null) : null;
  const complete = (!needWorkout || Boolean(workout)) && (!needFast || fastDone);
  return { needWorkout, needFast, workout, fastDone, complete };
}

/** Texto de la tarea según el detalle ("45 min de carrera", "fierritos", "+2 h de ayuno"). */
export function compDetailText(c: Compensation, d: CompDetail | null | undefined, sportLabel: (s: string) => string) {
  const det = d ?? { sport: "legacy", minutes: 30, fastHours: 2 };
  const workout =
    det.sport === "legacy"
      ? "fierritos o 30 min de carrera"
      : `${det.sport === "any" ? "un entreno" : sportLabel(det.sport).toLowerCase()}${det.minutes ? ` de ${det.minutes} min o más` : ""}`;
  const fast = `+${det.fastHours} h de ayuno`;
  return c === "fast" ? fast : c === "workout" ? workout : `${fast} y ${workout}`;
}

/**
 * ¿El ayuno de la noche del derrape llegó a sus horas + las extra de la compensación?
 * Terminado a mano: cuenta lo que duró. Sin terminar: se da por hecho al pasar el tiempo de confirmación.
 */
export function compFastDone(date: string, cfg: FastConfig, record: FastDay | null, fastHours: number, now: Date) {
  if (record?.status === "broken") return false;
  const w = fastWindow(date, cfg, record);
  const need = (baseDurationMinutes(cfg) + fastHours * 60 - 10) * 60_000;
  if (w.closed) return w.end.getTime() - w.start.getTime() >= need;
  if (now.getTime() < w.plannedEnd.getTime() + OVERTIME_MS) return false;
  return w.plannedEnd.getTime() - w.start.getTime() >= need;
}
