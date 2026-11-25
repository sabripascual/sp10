// Objetivo semanal ("Tu semana ideal"): lo mínimo que querés cumplir de lunes a domingo.
// Lógica pura: se usa en el cliente, en el servidor y en los avisos.
import { ALL_TYPES, TYPE_EMOJI, TYPE_LABEL, type WorkoutType } from "@/lib/training-types";

export type GoalKey = "ayuno" | Exclude<WorkoutType, "otro">;
/** Cuántas veces por semana. Lo que no está (o está en 0) no cuenta. */
export type Goals = Partial<Record<GoalKey, number>>;

export const GOAL_KEYS: GoalKey[] = ["ayuno", ...(ALL_TYPES.filter((t) => t !== "otro") as Exclude<WorkoutType, "otro">[])];
export const MAX_PER_GOAL = 7;

export const GOAL_LABEL: Record<GoalKey, { emoji: string; label: string; one: string; many: string }> = {
  ayuno: { emoji: "⏱️", label: "Ayunos", one: "ayuno", many: "ayunos" },
  ...(Object.fromEntries(
    GOAL_KEYS.filter((k) => k !== "ayuno").map((k) => {
      const t = k as WorkoutType;
      const name = t === "fuerza" ? "fierrito" : t === "bici" ? "salida en bici" : TYPE_LABEL[t].toLowerCase();
      const many = t === "fuerza" ? "fierritos" : t === "correr" ? "carreras" : t === "bici" ? "salidas en bici" : name;
      return [k, { emoji: TYPE_EMOJI[t], label: TYPE_LABEL[t], one: name, many }];
    }),
  ) as Record<Exclude<GoalKey, "ayuno">, { emoji: string; label: string; one: string; many: string }>),
};

/**
 * Objetivos válidos del perfil. Sin configurar: 5 ayunos y la meta de fierritos de siempre.
 * Si no hace ayuno (fasting = false), el ayuno no cuenta.
 */
export function goalsOf(raw: unknown, strengthGoal = 3, fasting = true): Goals {
  const out: Goals = {};
  const fierritos = Math.min(Math.max(strengthGoal, 1), MAX_PER_GOAL);
  if (raw && typeof raw === "object") {
    for (const k of GOAL_KEYS) {
      if (k === "ayuno" && !fasting) continue;
      const n = Number((raw as Record<string, unknown>)[k]);
      if (Number.isInteger(n) && n > 0) out[k] = Math.min(n, MAX_PER_GOAL);
    }
  }
  if (Object.keys(out).length) return out;
  return fasting ? { ayuno: 5, fuerza: fierritos } : { fuerza: fierritos };
}

/** Objetivos de un perfil, respetando si hace ayuno. */
export function profileGoals(p: { weekly_goals?: unknown; strength_goal: number; fasting_enabled?: boolean | null }) {
  return goalsOf(p.weekly_goals, p.strength_goal, p.fasting_enabled !== false);
}

export type WeekCounts = { fastOk: number; byType: Record<string, number> };

export type GoalItem = { key: GoalKey; emoji: string; label: string; done: number; target: number; ratio: number };

/** Avance de cada objetivo y el total (promedio: cada objetivo pesa lo mismo). */
export function goalProgress(goals: Goals, c: WeekCounts) {
  const items: GoalItem[] = GOAL_KEYS.filter((k) => (goals[k] ?? 0) > 0).map((k) => {
    const target = goals[k]!;
    const done = k === "ayuno" ? c.fastOk : (c.byType[k] ?? 0);
    return { key: k, emoji: GOAL_LABEL[k].emoji, label: GOAL_LABEL[k].label, done, target, ratio: Math.min(done / target, 1) };
  });
  const pct = items.length ? Math.round((items.reduce((a, i) => a + i.ratio, 0) / items.length) * 100) : 0;
  return { items, pct };
}

/** "2 ayunos y 1 fierrito" (lo que falta), o "" si está todo. */
export function missingText(items: GoalItem[]) {
  const parts = items
    .filter((i) => i.done < i.target)
    .map((i) => {
      const n = i.target - i.done;
      return `${n} ${n === 1 ? GOAL_LABEL[i.key].one : GOAL_LABEL[i.key].many}`;
    });
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`;
}

/** "5/5 ayunos, 1/2 fierritos, 1/1 fútbol" */
export function goalsText(items: GoalItem[]) {
  return items.map((i) => `${i.done}/${i.target} ${i.target === 1 ? GOAL_LABEL[i.key].one : GOAL_LABEL[i.key].many}`).join(", ");
}

/** A dónde lleva un aviso de la semana: a registrar lo primero que falta (deporte), al ayuno, o a Hoy. */
export function goalActionUrl(items: GoalItem[]) {
  const missing = items.filter((i) => i.done < i.target);
  const sport = missing.find((i) => i.key !== "ayuno");
  if (sport) return `/entrenos?registrar=${sport.key}`;
  if (missing.length) return "/ayuno";
  return "/";
}
