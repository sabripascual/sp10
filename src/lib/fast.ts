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
};

export type FastConfig = {
  fast_start: string; // "HH:MM" o "HH:MM:SS"
  fast_end: string;
  timezone: string;
};

export type FastWindow = {
  date: string;
  start: Date;
  end: Date;
  record: FastDay | null;
};

export type FastState =
  | { phase: "fasting"; window: FastWindow }
  | { phase: "broken"; window: FastWindow; next: FastWindow }
  | { phase: "eating"; previous: FastWindow; next: FastWindow; canExtend: boolean };

export type DayMark = "ok" | "extended" | "event" | "broken" | "pending" | "none";

/** Ventana después del fin del ayuno en la que todavía se puede extender. */
const EXTEND_GRACE_MS = 2 * 60 * 60 * 1000;
export const MAX_EXTRA_HOURS = 8;

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

export function fastWindow(date: string, cfg: FastConfig, record: FastDay | null): FastWindow {
  const start = fromZonedTime(`${date}T${cfg.fast_start.slice(0, 5)}:00`, cfg.timezone);
  const minutes = baseDurationMinutes(cfg) + (record?.extra_hours ?? 0) * 60;
  return { date, start, end: new Date(start.getTime() + minutes * 60_000), record };
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

  if (active) {
    return active.record?.status === "broken"
      ? { phase: "broken", window: active, next }
      : { phase: "fasting", window: active };
  }

  const previous = [...candidates].reverse().find((w) => w.end <= now)!;
  const canExtend =
    previous.record?.status !== "broken" &&
    now.getTime() - previous.end.getTime() < EXTEND_GRACE_MS &&
    (previous.record?.extra_hours ?? 0) < MAX_EXTRA_HOURS;
  return { phase: "eating", previous, next, canExtend };
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
