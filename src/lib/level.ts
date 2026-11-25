// "¿Cómo venís?": nivel de la semana, de perrita pajera a perrita nivel dios.
// Se califica la semana cerrada (lunes a domingo); cambia cada lunes.
import { weekGoals, type WeekSummary } from "@/lib/progress";

export type LevelKey = "pajera" | "vagoneta" | "promedio" | "motivada" | "crack" | "dios";

export const LEVELS: { key: LevelKey; min: number; name: string; emoji: string; blurb: string }[] = [
  { key: "pajera", min: 0, name: "Perrita pajera", emoji: "💤", blurb: "Semana de sillón. Pasa en las mejores familias: el lunes arrancamos de cero." },
  { key: "vagoneta", min: 30, name: "Perrita vagoneta", emoji: "🛋️", blurb: "Algo hubo, pero a tu semana ideal le faltó bastante. Un par de cosas más y subís." },
  { key: "promedio", min: 45, name: "Perrita promedio de la humanidad", emoji: "😐", blurb: "Ni fu ni fa. Con un empujoncito pasás a motivada." },
  { key: "motivada", min: 60, name: "Perrita motivada", emoji: "🔥", blurb: "Se nota la onda. Seguí así que la crack está cerca." },
  { key: "crack", min: 75, name: "Perrita crack", emoji: "⚡", blurb: "Semana de crack. Ni el Dibu ataja tanta constancia." },
  { key: "dios", min: 90, name: "Perrita nivel dios", emoji: "👑", blurb: "Todo cumplido. Sos inalcanzable." },
];

/**
 * Puntaje 0-100, a partir de tu objetivo semanal (Ajustes → Tu semana ideal):
 *  - Objetivos 85: se reparten en partes iguales entre lo que elegiste
 *    (ej. ayunos, fierritos y fútbol → ~28 cada uno); cada uno suma según hecho / meta (tope 1).
 *  - Derrapes 15: compensados no restan; cada uno que cerró la semana sin compensar resta 7,5.
 */
export type ScorePart = { key: string; emoji: string; label: string; points: number; max: number; why: string };

const GOALS_POINTS = 85;

/** Desglose del puntaje: cuántos puntos sumó cada parte y por qué. */
export function scoreParts(w: WeekSummary): ScorePart[] {
  const { items } = weekGoals(w);
  const n = items.length;
  const parts: ScorePart[] = items.map((g, i) => {
    // reparto de 85 sin perder puntos por redondeo
    const max = Math.floor(GOALS_POINTS / n) + (i < GOALS_POINTS % n ? 1 : 0);
    return { key: g.key, emoji: g.emoji, label: g.label, max, points: Math.round(g.ratio * max), why: `${g.done} de ${g.target}` };
  });
  parts.push({
    key: "derrapes",
    emoji: "😈",
    label: "Derrapes",
    max: 15,
    points: Math.round(Math.max(0, 15 - 7.5 * w.missed)),
    why: w.missed ? `${w.missed} sin compensar` : "ninguno sin compensar",
  });
  return parts;
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
