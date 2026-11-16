// Lógica pura del ayuno: sin base de datos, fácil de testear.
// Un ayuno se identifica por la fecha local en que arranca (la noche).
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export type FastStatus = "ok" | "broken" | "extended" | "event";

export type FastDay = {
  date: string; // yyyy-MM-dd
  status: FastStatus;
  broken_at: string | null;
  extra_hours: number;
  event_id: string | null;
  started_at?: string | null;
  ended_at?: string | null;
};

export type FastConfig = {
  fast_start: string; // "HH:MM" o "HH:MM:SS"
  fast_end: string;
  timezone: string;
};

export type FastWindow = {
  date: string;
  start: Date;
  /** Fin real si se cerró a mano; si no, el fin planeado. */
  end: Date;
  /** Inicio + duración del protocolo + extensión. */
  plannedEnd: Date;
  /** true si tiene hora de fin confirmada (Terminar / Lo rompí). */
  closed: boolean;
  record: FastDay | null;
};

export type FastState =
  | { phase: "fasting"; window: FastWindow }
  /** Llegó a la hora de fin y no confirmó: sigue contando y pregunta "¿terminaste o seguís?". */
  | { phase: "overtime"; window: FastWindow }
  | { phase: "eating"; previous: FastWindow; next: FastWindow; canExtend: boolean; canResume: boolean };

export type DayMark = "ok" | "extended" | "event" | "broken" | "pending" | "none";

/** Ventana después del fin del ayuno en la que todavía se puede extender. */
const EXTEND_GRACE_MS = 2 * 60 * 60 * 1000;
export const MAX_EXTRA_HOURS = 8;
/** Cuánto espera la confirmación de fin; después lo da por terminado a la hora planeada. */
export const OVERTIME_MS = 6 * 60 * 60 * 1000;

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function baseDurationMinutes(cfg: FastConfig) {
  let d = toMinutes(cfg.fast_end) - toMinutes(cfg.fast_start);
  if (d <= 0) d += 24 * 60;
  return d;
}

export function localDate(now: Date, tz: string) {
  return formatInTimeZone(now, tz, "yyyy-MM-dd");
}

/** Suma días a una fecha yyyy-MM-dd sin problemas de zona horaria. */
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function scheduledStart(date: string, cfg: FastConfig) {
  return fromZonedTime(`${date}T${cfg.fast_start.slice(0, 5)}:00`, cfg.timezone);
}

/**
 * Ventana real de un ayuno: arranca a la hora tocada en "Empezar" (o la del horario)
 * y termina a la hora tocada en "Terminar" / "Lo rompí" (o inicio + 16 h + extensión).
 */
export function fastWindow(date: string, cfg: FastConfig, record: FastDay | null): FastWindow {
  const start = record?.started_at ? new Date(record.started_at) : scheduledStart(date, cfg);
  const planned = baseDurationMinutes(cfg) + (record?.extra_hours ?? 0) * 60;
  const closedAt = record?.ended_at ?? record?.broken_at;
  const plannedEnd = new Date(start.getTime() + planned * 60_000);
  const end = closedAt ? new Date(closedAt) : plannedEnd;
  return { date, start, end, plannedEnd, closed: Boolean(closedAt), record };
}

/** Resultado de terminar un ayuno a la hora `endAt`. */
export function closeOutcome(start: Date, endAt: Date, cfg: FastConfig) {
  const base = baseDurationMinutes(cfg) * 60_000;
  const elapsed = endAt.getTime() - start.getTime();
  const TOLERANCE = 10 * 60_000; // 10 min de changüí
  if (elapsed + TOLERANCE < base) return { status: "broken" as const, extra_hours: 0, missingMs: base - elapsed };
  const extra = Math.min(Math.floor((elapsed - base + TOLERANCE) / 3_600_000), MAX_EXTRA_HOURS);
  return { status: extra > 0 ? ("extended" as const) : ("ok" as const), extra_hours: extra, missingMs: 0 };
}

export function getFastState(
  now: Date,
  cfg: FastConfig,
  records: Map<string, FastDay>,
): FastState {
  const today = localDate(now, cfg.timezone);
  const win = (d: string) => fastWindow(d, cfg, records.get(d) ?? null);
  const candidates = [shiftDate(today, -1), today, shiftDate(today, 1)].map(win);

  const active = candidates.find((w) => w.start <= now && now < w.end);
  const next = candidates.find((w) => w.start > now)!;

  if (active) return { phase: "fasting", window: active };

  // Pasó la hora de fin sin confirmar: el ayuno sigue hasta que digas "terminé"
  const overtime = candidates.find(
    (w) =>
      !w.closed &&
      w.record?.status !== "broken" &&
      w.plannedEnd <= now &&
      now.getTime() < w.plannedEnd.getTime() + OVERTIME_MS,
  );
  if (overtime) return { phase: "overtime", window: overtime };

  const previous = [...candidates]
    .filter((w) => w.end <= now)
    .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
  const recent = now.getTime() - previous.end.getTime() < EXTEND_GRACE_MS;
  const closedByHand = Boolean(previous.record?.ended_at || previous.record?.broken_at);
  return {
    phase: "eating",
    previous,
    next,
    // terminó solo a la hora del horario: se puede estirar
    canExtend: recent && !closedByHand && (previous.record?.extra_hours ?? 0) < MAX_EXTRA_HOURS,
    // lo terminaste a mano hace poco: "Seguir ayunando" lo deshace
    canResume: recent && closedByHand,
  };
}

/** Marca de un día para el calendario y la racha. */
export function dayMark(
  date: string,
  now: Date,
  cfg: FastConfig,
  records: Map<string, FastDay>,
  sinceDate: string,
): DayMark {
  if (date < sinceDate) return "none";
  const w = fastWindow(date, cfg, records.get(date) ?? null);
  const status = w.record?.status;
  if (status === "broken") return "broken";
  if (w.end > now) return "pending";
  if (status === "extended" || status === "event") return status;
  return "ok";
}

/** Ayunos cumplidos seguidos. Uno en curso no suma; uno roto corta. */
export function fastStreak(
  now: Date,
  cfg: FastConfig,
  records: Map<string, FastDay>,
  sinceDate: string,
) {
  let streak = 0;
  for (let d = localDate(now, cfg.timezone); d >= sinceDate; d = shiftDate(d, -1)) {
    const mark = dayMark(d, now, cfg, records, sinceDate);
    if (mark === "broken") break;
    if (mark === "pending") continue;
    streak++;
  }
  return streak;
}

export function lastNDays(now: Date, tz: string, n: number) {
  const today = localDate(now, tz);
  return Array.from({ length: n }, (_, i) => shiftDate(today, i - n + 1));
}

/** extra_hours para que el fin planeado quede `hours` después de ahora (o del fin actual si es más tarde). */
export function extraHoursFor(window: FastWindow, now: Date, hours: number, cfg: FastConfig) {
  const baseEnd = window.start.getTime() + baseDurationMinutes(cfg) * 60_000;
  const from = Math.max(now.getTime(), window.plannedEnd.getTime());
  const extra = Math.ceil((from + hours * 3_600_000 - baseEnd) / 3_600_000);
  return Math.max(0, Math.min(extra, MAX_EXTRA_HOURS));
}

/** Duración real (o según horario) de un ayuno. */
export function fastDuration(w: FastWindow) {
  return w.end.getTime() - w.start.getTime();
}
