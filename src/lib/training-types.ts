// Tipos y constantes de entrenos: se pueden usar en el cliente.
import type { EventPhase, SocialEvent } from "@/lib/events";

export type WorkoutType = "futbol" | "fuerza" | "correr" | "padel" | "otro";
export type Feeling = "dificil" | "bien" | "excelente";

export type Workout = {
  id: string;
  date: string;
  type: WorkoutType;
  minutes: number | null;
  feeling: Feeling | null;
  note: string | null;
  source: "manual" | "template";
  status: "done" | "skipped";
};

export const TYPE_LABEL: Record<WorkoutType, string> = {
  futbol: "Fútbol",
  fuerza: "Fuerza",
  correr: "Correr",
  padel: "Pádel",
  otro: "Otro",
};

export const TYPE_EMOJI: Record<WorkoutType, string> = {
  futbol: "⚽",
  fuerza: "🏋️",
  correr: "🏃‍♀️",
  padel: "🎾",
  otro: "✨",
};

export type DayPlan = {
  date: string;
  isoDay: number;
  isToday: boolean;
  isFuture: boolean;
  planned: WorkoutType | null; // de la plantilla semanal
  workouts: Workout[]; // hechos
  skipped: boolean; // marcó "no fui" en lo planeado
  /** planeado, ya pasó o es hoy, y todavía no confirmó ni marcó "no fui" */
  awaitingConfirm: boolean;
};

export type EventView = SocialEvent & { phase: EventPhase };

