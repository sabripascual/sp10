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
export function weekScore(w: WeekSummary) {
  const fast = w.fastDays ? (w.fastOk / w.fastDays) * 35 : 0;
  const strength = Math.min(w.strength / Math.max(w.strengthGoal, 1), 1) * 35;
  const extra = Math.min(w.otherWorkouts / 3, 1) * 15;
  const derrapes = Math.max(0, 15 - 7.5 * w.pending);
  return Math.round(fast + strength + extra + derrapes);
}

export function levelFor(score: number) {
  return [...LEVELS].reverse().find((l) => score >= l.min)!;
}

/** Semanas con datos (desde que empezaste) → nivel de cada una y cuántas veces fuiste cada perrita. */
export function levelHistory(weeks: WeekSummary[], firstWeek: string) {
  const closed = weeks.filter((w) => !w.isCurrent && w.weekStart >= firstWeek);
  const graded = closed.map((w) => ({ weekStart: w.weekStart, score: weekScore(w), level: levelFor(weekScore(w)).key }));
  const counts = Object.fromEntries(LEVELS.map((l) => [l.key, 0])) as Record<LevelKey, number>;
  graded.forEach((g) => counts[g.level]++);
  return { last: graded.at(-1) ?? null, graded, counts };
}
