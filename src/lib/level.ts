// "¿Cómo venís?": nivel de la semana, de perrita pajera a perrita nivel dios.
// Se califica la semana cerrada (lunes a domingo); cambia cada lunes.
import type { WeekSummary } from "@/lib/progress";

export type LevelKey = "pajera" | "vagoneta" | "promedio" | "motivada" | "crack" | "dios";

export const LEVELS: { key: LevelKey; min: number; name: string; emoji: string; blurb: string }[] = [
  { key: "pajera", min: 0, name: "Perrita pajera", emoji: "💤", blurb: "Semana de sillón. Pasa en las mejores familias: el lunes arrancamos de cero." },
  { key: "vagoneta", min: 30, name: "Perrita vagoneta", emoji: "🛋️", blurb: "El ayuno viene, al cuerpo le falta movimiento. Unos fierritos y subís." },
  { key: "promedio", min: 45, name: "Perrita promedio de la humanidad", emoji: "😐", blurb: "Ni fu ni fa. Con un empujoncito pasás a motivada." },
  { key: "motivada", min: 60, name: "Perrita motivada", emoji: "🔥", blurb: "Se nota la onda. Seguí así que la crack está cerca." },
  { key: "crack", min: 75, name: "Perrita crack", emoji: "⚡", blurb: "Semana de crack. Ni el Dibu ataja tanta constancia." },
  { key: "dios", min: 90, name: "Perrita nivel dios", emoji: "👑", blurb: "Todo cumplido. Sos inalcanzable." },
];

/**
 * Puntaje 0-100:
 *  - Ayuno 35: cumplidos / días contados
 *  - Fierritos 35: hechos / meta (tope 1)
 *  - Movimiento extra 15: carrera, fútbol, pádel… (3 o más = completo)
 *  - Derrapes 15: compensados no restan; cada pendiente resta 7,5
 */
export type ScorePart = { key: "ayuno" | "fierritos" | "movimiento" | "derrapes"; emoji: string; points: number; max: number; why: string };

/** Desglose del puntaje: cuántos puntos sumó cada parte y por qué. */
export function scoreParts(w: WeekSummary): ScorePart[] {
  const goal = Math.max(w.strengthGoal, 1);
  return [
    { key: "ayuno", emoji: "⏱️", max: 35, points: Math.round(w.fastDays ? (w.fastOk / w.fastDays) * 35 : 0), why: `${w.fastOk}/${w.fastDays} ayunos` },
    { key: "fierritos", emoji: "💪🏻", max: 35, points: Math.round(Math.min(w.strength / goal, 1) * 35), why: `${w.strength}/${goal} fierritos` },
    { key: "movimiento", emoji: "🏃‍♀️", max: 15, points: Math.round(Math.min(w.otherWorkouts / 3, 1) * 15), why: `${w.otherWorkouts}/3 extra` },
    {
      key: "derrapes",
      emoji: "😈",
      max: 15,
      points: Math.round(Math.max(0, 15 - 7.5 * w.pending)),
      why: w.pending ? `${w.pending} sin compensar` : "sin deudas",
    },
  ];
}

export function weekScore(w: WeekSummary) {
  return scoreParts(w).reduce((a, p) => a + p.points, 0);
}

/** Primera semana que se califica: la primera COMPLETA desde que empezaste (no una de 1 o 2 días). */
export function firstGradedWeek(since: string) {
  const d = new Date(`${since}T12:00:00Z`).getUTCDay(); // 1 = lunes
  const monday = new Date(`${since}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() + (d === 1 ? 0 : ((8 - d) % 7 || 7)));
  return monday.toISOString().slice(0, 10);
}

export function levelFor(score: number) {
  return [...LEVELS].reverse().find((l) => score >= l.min)!;
}

/** Semanas con datos (desde que empezaste) → nivel de cada una y cuántas veces fuiste cada perrita. */
export function levelHistory(weeks: WeekSummary[], firstWeek: string) {
  const closed = weeks.filter((w) => !w.isCurrent && w.weekStart >= firstWeek);
  const graded = closed.map((w) => ({
    weekStart: w.weekStart,
    score: weekScore(w),
    level: levelFor(weekScore(w)).key,
    parts: scoreParts(w),
  }));
  const counts = Object.fromEntries(LEVELS.map((l) => [l.key, 0])) as Record<LevelKey, number>;
  graded.forEach((g) => counts[g.level]++);
  return { last: graded.at(-1) ?? null, graded, counts };
}
