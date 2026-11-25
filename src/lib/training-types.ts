// Tipos y constantes de entrenos: se pueden usar en el cliente.
import type { EventPhase, SocialEvent } from "@/lib/events";

// Las claves internas no cambian ("fuerza" = Fierritos, "correr" = Carrera).
export type WorkoutType = "fuerza" | "correr" | "futbol" | "padel" | "tenis" | "squash" | "trekking" | "bici" | "otro";
export type Feeling = "dificil" | "bien" | "excelente";

export type Zone = "brazos" | "core" | "piernas";
export const ZONES: { key: Zone; label: string; emoji: string }[] = [
  { key: "brazos", label: "Brazos", emoji: "💪🏻" },
  { key: "core", label: "Core", emoji: "🔥" },
  { key: "piernas", label: "Piernas", emoji: "🦵🏻" },
];

export type ZoneWork = { exercises: number; reps: number; rounds: number };
export type WorkoutDetails = { zones?: Partial<Record<Zone, ZoneWork>>; kcal?: number };

export type Workout = {
  id: string;
  date: string;
  type: WorkoutType;
  minutes: number | null;
  feeling: Feeling | null;
  note: string | null;
  source: "manual" | "template";
  status: "done" | "skipped";
  details: WorkoutDetails;
};

export const TYPE_LABEL: Record<WorkoutType, string> = {
  fuerza: "Fierritos",
  correr: "Carrera",
  futbol: "Fútbol",
  padel: "Pádel",
  tenis: "Tenis",
  squash: "Squash",
  trekking: "Trekking",
  bici: "Bici",
  otro: "Otro",
};

export const ALL_TYPES: WorkoutType[] = ["fuerza", "correr", "futbol", "padel", "tenis", "squash", "trekking", "bici", "otro"];
export const DEFAULT_FAVORITES: WorkoutType[] = ["fuerza", "correr", "futbol", "padel"];
export const MAX_FAVORITES = 4;

/** Deportes frecuentes válidos de un perfil (o los de siempre). */
export function favoritesOf(raw: string[] | null | undefined): WorkoutType[] {
  const list = (raw ?? []).filter((t): t is WorkoutType => ALL_TYPES.includes(t as WorkoutType)).slice(0, MAX_FAVORITES);
  return list.length ? list : DEFAULT_FAVORITES;
}

export const TYPE_EMOJI: Record<WorkoutType, string> = {
  fuerza: "💪🏻",
  correr: "🏃‍♀️",
  futbol: "⚽",
  padel: "🏓",
  tenis: "🎾",
  squash: "⚫",
  trekking: "🥾",
  bici: "🚴‍♀️",
  otro: "✨",
};

/** kcal aproximadas de una carrera: MET 8,3 (trote suave) × kg × horas. */
export function runKcal(minutes: number, weightKg: number) {
  return Math.round(8.3 * weightKg * (minutes / 60));
}

export function zonesSummary(d: WorkoutDetails) {
  return ZONES.filter((z) => d.zones?.[z.key])
    .map((z) => {
      const w = d.zones![z.key]!;
      return `${z.label} ${w.exercises}×${w.reps}×${w.rounds}`;
    })
    .join(" · ");
}

export type DayPlan = {
  date: string;
  isoDay: number;
  isToday: boolean;
  isFuture: boolean;
  workouts: Workout[]; // hechos
};

export type EventView = SocialEvent & { phase: EventPhase };

/** Un fierrito anterior con detalle, para reutilizarlo. */
export type RecentStrength = { date: string; minutes: number | null; details: WorkoutDetails };
