// Lógica pura de eventos y compensación.
import { shiftDate } from "@/lib/fast";
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
