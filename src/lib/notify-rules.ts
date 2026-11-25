// Qué avisos tocan ahora. Lógica pura: recibe el estado y devuelve la lista.
import { formatInTimeZone } from "date-fns-tz";
import {
  baseDurationMinutes,
  fastWindow,
  localDate,
  shiftDate,
  type FastConfig,
  type FastDay,
} from "@/lib/fast";
import { isoDay } from "@/lib/week";
import type { NotifyKind } from "@/lib/phrases";
import { goalActionUrl, missingText, type GoalItem } from "@/lib/goals";

export type NotifyContext = {
  now: Date;
  cfg: FastConfig;
  prefs: Partial<Record<NotifyKind, boolean>>;
  fastRecords: Map<string, FastDay>;
  /** Avance del objetivo semanal (Ajustes → Tu semana ideal). */
  goals: { pct: number; items: GoalItem[] };
  /** false = no hace ayuno: no van los avisos del ayuno. */
  fasting?: boolean;
  events: {
    id: string;
    name: string;
    date: string;
    compensated_at: string | null;
  }[];
  bodyNextDate: string;
  bodyDoneToday: boolean;
  weekSummary: string; // "3/3 fuerza, 7/7 ayuno, ..."
  sent: Set<string>; // `${kind}|${ref}`
};

export type DueNotification = {
  kind: NotifyKind;
  ref: string;
  vars: Record<string, string | number>;
  /** A dónde lleva al tocarlo, si no es el de siempre (URLS). */
  url?: string;
};

/** Cuánto tiempo después de la hora se acepta mandar (el cron corre cada 15 min). */
const CATCH_UP_MIN = 30;
const QUIET_FROM = 23 * 60;
const QUIET_TO = 8 * 60 + 30;
const DAYS = [
  "",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function isQuiet(now: Date, tz: string) {
  const m = toMin(formatInTimeZone(now, tz, "HH:mm"));
  return m >= QUIET_FROM || m < QUIET_TO;
}

export function dueNotifications(ctx: NotifyContext): DueNotification[] {
  const { now, cfg } = ctx;
  if (isQuiet(now, cfg.timezone)) return [];

  const today = localDate(now, cfg.timezone);
  const nowMin = toMin(formatInTimeZone(now, cfg.timezone, "HH:mm"));
  const day = isoDay(today);
  const out: DueNotification[] = [];

  const add = (kind: NotifyKind, ref: string, vars: Record<string, string | number> = {}, url?: string) => {
    if (ctx.prefs[kind] === false) return;
    if (ctx.sent.has(`${kind}|${ref}`)) return;
    out.push({ kind, ref, vars, ...(url ? { url } : {}) });
  };
  const at = (hhmm: string | number) => {
    const target = typeof hhmm === "number" ? hhmm : toMin(hhmm);
    const diff = nowMin - target;
    return diff >= 0 && diff < CATCH_UP_MIN;
  };

  const startMin = toMin(cfg.fast_start);
  const fin = cfg.fast_end.slice(0, 5);

  // Ventana y ayuno (solo si hace ayuno)
  if (ctx.fasting !== false) {
    if (at(startMin - 30)) add("window_closing", today);
    // Recordatorio para empezar el ayuno, y otro 1 h después si no lo marcó
    const tonight = ctx.fastRecords.get(today);
    const marked = Boolean(tonight?.started_at || tonight?.ended_at);
    if (at(startMin) && !marked) add("fast_started", today, { fin });
    if (at(startMin + 60) && !marked) add("fast_confirm", today);
    // Llegó a la hora de fin sin confirmar: "¿terminaste o seguís?" y, 2 h después, otro recordatorio.
    // El ref incluye la extensión: si extendió, vuelve a preguntar al nuevo fin.
    for (const d of [shiftDate(today, -1), today]) {
      const r = ctx.fastRecords.get(d) ?? null;
      const w = fastWindow(d, cfg, r);
      if (w.closed || r?.status === "broken") continue;
      const diff = (now.getTime() - w.plannedEnd.getTime()) / 60_000;
      const horas =
        Math.round((w.plannedEnd.getTime() - w.start.getTime()) / 3_600_000) ||
        baseDurationMinutes(cfg) / 60;
      const ref = `${d}+${r?.extra_hours ?? 0}`;
      if (diff >= 0 && diff < CATCH_UP_MIN) add("fast_done", ref, { horas });
      if (diff >= 120 && diff < 120 + CATCH_UP_MIN)
        add("fast_unconfirmed", ref);
    }
  }

  // Cómo va la semana ideal: jueves y domingo a las 10, si falta algo
  if (at("10:00")) {
    if (
      (day === 4 || day === 7) &&
      ctx.goals.items.length &&
      ctx.goals.pct < 100
    )
      add("week_goals", today, {
        pct: ctx.goals.pct,
        falta: missingText(ctx.goals.items),
        dia: DAYS[day],
      }, goalActionUrl(ctx.goals.items));

    for (const ev of ctx.events) {
      if (ev.date === shiftDate(today, 1))
        add("event_tomorrow", ev.id, { evento: ev.name });
      if (ev.date === shiftDate(today, -1) && !ev.compensated_at)
        add("compensation_today", ev.id, { evento: ev.name });
      // Último día para compensar (domingo) de un derrape de días anteriores
      if (
        day === 7 &&
        ev.date < shiftDate(today, -1) &&
        ev.date >= shiftDate(today, -6) &&
        !ev.compensated_at
      )
        add("compensation_last", ev.id, { evento: ev.name });
    }
  }

  if (at("09:30") && ctx.bodyNextDate <= today && !ctx.bodyDoneToday)
    add("body_check", today);

  if (day === 7 && at("20:00"))
    add("weekly_summary", today, { resumen: ctx.weekSummary });

  return out;
}
