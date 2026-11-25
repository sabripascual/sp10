// Avisos del coach (los maneja solo el admin): nivel del lunes, pronóstico del miércoles,
// hitos de racha y "¿dónde andás?". Lógica pura: recibe lo calculado y devuelve qué toca.
import { formatInTimeZone } from "date-fns-tz";
import { localDate, shiftDate } from "@/lib/fast";
import { LEVELS, levelFor, type LevelKey } from "@/lib/level";
import { missingText, type GoalItem } from "@/lib/goals";
import { isoDay, weekStart } from "@/lib/week";
import { FORECAST_LINES, LEVEL_LINES, MILESTONE_LINES, type CoachKind } from "@/lib/phrases";
import { isQuiet, type DueNotification } from "@/lib/notify-rules";

const CATCH_UP_MIN = 30;
export const LEVEL_AT = "09:30"; // lunes
export const FORECAST_AT = "13:00"; // miércoles
export const MILESTONE_AT = "12:00";
export const IDLE_AT = "18:00";
export const FAST_MILESTONES = [7, 14, 30, 60, 100];
export const STRENGTH_MILESTONES = [4, 8, 12];
export const IDLE_DAYS = 3;
/** Al mediodía del miércoles ya pasó ~2,5 de 7 días. */
const FORECAST_FACTOR = 7 / 2.5;

export type CoachContext = {
  now: Date;
  tz: string;
  /** Prendido/apagado global desde el Panel Ringo (lo que no está = prendido). */
  enabled: Partial<Record<CoachKind, boolean>>;
  sent: Set<string>;
  fasting: boolean;
  /** Nivel de la semana que cerró y de la anterior (null = no calificada). */
  last: { weekStart: string; score: number; level: LevelKey } | null;
  prev: { level: LevelKey } | null;
  /** Puesto en el Ringo Club (si es miembro). */
  club: { pos: number; total: number } | null;
  /** Semana en curso. */
  current: { pct: number; items: GoalItem[] };
  fastStreak: number;
  strengthRun: number;
  /** Último registro de cualquier tipo (ISO) y alta de la cuenta (yyyy-MM-dd). */
  lastActivity: string | null;
  createdDate: string;
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const pick = <T>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)];
const levelInfo = (k: LevelKey) => LEVELS.find((l) => l.key === k)!;

/** Si seguís al mismo ritmo: nivel con que cerrarías la semana. */
export function forecastLevel(items: GoalItem[]) {
  if (!items.length) return levelFor(15);
  const avg = items.reduce((a, i) => a + Math.min(1, (i.done / i.target) * FORECAST_FACTOR), 0) / items.length;
  return levelFor(Math.round(avg * 85) + 15);
}

export function coachNotifications(ctx: CoachContext, rand: () => number = Math.random): DueNotification[] {
  if (isQuiet(ctx.now, ctx.tz)) return [];
  const today = localDate(ctx.now, ctx.tz);
  const day = isoDay(today);
  const nowMin = toMin(formatInTimeZone(ctx.now, ctx.tz, "HH:mm"));
  const at = (hhmm: string) => {
    const diff = nowMin - toMin(hhmm);
    return diff >= 0 && diff < CATCH_UP_MIN;
  };
  const out: DueNotification[] = [];
  const add = (kind: CoachKind, ref: string, vars: Record<string, string | number>) => {
    if (ctx.enabled[kind] === false || ctx.sent.has(`${kind}|${ref}`)) return;
    out.push({ kind, ref, vars });
  };

  // 1. Lunes: salió tu nivel
  if (day === 1 && at(LEVEL_AT) && ctx.last) {
    const lvl = levelInfo(ctx.last.level);
    let linea = pick(LEVEL_LINES[lvl.key], rand).replaceAll("{pts}", String(ctx.last.score));
    if (!ctx.prev) linea = `Tu primer nivel: ${linea.charAt(0).toLowerCase()}${linea.slice(1)}`;
    let cambio = "";
    if (ctx.prev && ctx.prev.level !== lvl.key) {
      const up = LEVELS.findIndex((l) => l.key === lvl.key) > LEVELS.findIndex((l) => l.key === ctx.prev!.level);
      const from = levelInfo(ctx.prev.level).name.replace("Perrita ", "");
      cambio = up
        ? ` Subiste de ${from} a ${lvl.name.replace("Perrita ", "")}, esaaa 📈`
        : " Bajaste un escalón, nada que unos fierritos no arreglen.";
    }
    const puesto = ctx.club ? ` Quedaste ${ctx.club.pos}ª de ${ctx.club.total} en el Club 🏆` : "";
    add("level_result", ctx.last.weekStart, { emoji: lvl.emoji, linea, cambio, puesto });
  }

  // 2. Miércoles: pronóstico
  if (day === 3 && at(FORECAST_AT) && ctx.current.items.length) {
    const { pct, items } = ctx.current;
    const lvl = forecastLevel(items);
    const tone = pct >= 100 ? "done" : pct >= 50 ? "up" : pct >= 30 ? "mid" : "down";
    const linea = pick(FORECAST_LINES[tone], rand)
      .replaceAll("{nivel}", lvl.name.replace("Perrita ", ""))
      .replaceAll("{emoji}", lvl.emoji)
      .replaceAll("{pct}", String(pct))
      .replaceAll("{falta}", missingText(items));
    add("forecast", weekStart(today), { linea });
  }

  // 3. Hitos de racha (una vez por hito)
  if (at(MILESTONE_AT)) {
    if (ctx.fasting && FAST_MILESTONES.includes(ctx.fastStreak))
      add("streak_milestone", `ayuno-${ctx.fastStreak}-${today}`, {
        linea: pick(MILESTONE_LINES.ayuno, rand).replaceAll("{n}", String(ctx.fastStreak)),
      });
    if (day === 1 && STRENGTH_MILESTONES.includes(ctx.strengthRun))
      add("streak_milestone", `fierritos-${ctx.strengthRun}-${today}`, {
        linea: pick(MILESTONE_LINES.fierritos, rand).replaceAll("{n}", String(ctx.strengthRun)),
      });
  }

  // 4. ¿Dónde andás? 3 días sin anotar nada (y la cuenta tiene al menos 3 días), máx. 1 por semana
  if (at(IDLE_AT)) {
    const limit = shiftDate(today, -IDLE_DAYS);
    const lastDate = ctx.lastActivity ? localDate(new Date(ctx.lastActivity), ctx.tz) : ctx.createdDate;
    if (lastDate <= limit && ctx.createdDate <= limit) add("idle", weekStart(today), {});
  }

  return out;
}
