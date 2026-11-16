"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteWorkout } from "@/app/(tabs)/entrenos/actions";
import { TYPE_EMOJI, TYPE_LABEL, zonesSummary, type Workout } from "@/lib/training-types";
import { dayName } from "@/lib/week";

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [pending, start] = useTransition();
  if (workouts.length === 0) return <p className="text-sm text-muted">Todavía nada esta semana. ¡A estrenarla!</p>;
  return (
    <ul className="divide-y divide-muted/30">
      {workouts.map((w) => (
        <li key={w.id} className="flex items-center gap-3 py-3">
          <span className="text-xl">{TYPE_EMOJI[w.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {TYPE_LABEL[w.type]}
              {w.minutes ? ` · ${w.minutes} min` : ""}
              {w.details?.kcal ? ` · ≈ ${w.details.kcal} kcal` : ""}
            </p>
            <p className="truncate text-xs text-muted">
              {dayName(w.date)}
              {zonesSummary(w.details ?? {}) ? ` · ${zonesSummary(w.details ?? {})}` : ""}
              {w.note ? ` · ${w.note}` : ""}
            </p>
          </div>
          <button
            aria-label="Borrar"
            disabled={pending}
            onClick={() => start(async () => void (await deleteWorkout(w.id)))}
            className="grid size-9 place-items-center rounded-full text-muted active:bg-bg"
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
