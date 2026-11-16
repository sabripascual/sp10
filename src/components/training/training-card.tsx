import type { DayPlan } from "@/lib/training-types";
import { RegisterSheet } from "./register-sheet";
import { WeekStrip } from "./week-strip";

/** Entrenamientos de la semana: Fierritos y Carrera en bloques separados, semana y + Registrar. */
export function TrainingCard({
  week,
  strengthDone,
  goal,
  runMinutes,
  runKcal,
  today,
  weightKg,
  nicknames,
}: {
  week: DayPlan[];
  strengthDone: number;
  goal: number;
  runMinutes: number;
  runKcal: number;
  today: string;
  weightKg: number;
  nicknames: string[];
}) {
  const left = Math.max(goal - strengthDone, 0);
  const runs = week.flatMap((d) => d.workouts).filter((w) => w.type === "correr").length;
  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-muted">Entrenamientos · esta semana</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 rounded-xl bg-bg p-3">
          <p className="text-sm font-bold">💪🏻 Fierritos</p>
          <p className="text-3xl font-black tabular-nums">
            {strengthDone}
            <span className="text-lg text-muted">/{goal}</span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(strengthDone / goal, 1) * 100}%` }} />
          </div>
          <p className="text-xs text-muted">{left === 0 ? "¡Meta cumplida!" : `Te ${left === 1 ? "falta 1" : `faltan ${left}`}`}</p>
        </div>
        <div className="space-y-1 rounded-xl bg-bg p-3">
          <p className="text-sm font-bold">🏃‍♀️ Carrera</p>
          <p className="text-3xl font-black tabular-nums">
            {runMinutes}
            <span className="text-lg text-muted"> min</span>
          </p>
          <p className="text-xs text-muted">
            {runMinutes > 0 ? `${runKcal ? `≈ ${runKcal} kcal` : ""}${runs > 1 ? ` · ${runs} salidas` : ""}` : "Sin carreras todavía"}
          </p>
        </div>
      </div>

      <WeekStrip week={week} />
      <RegisterSheet today={today} weightKg={weightKg} nicknames={nicknames} className="w-full" />
    </div>
  );
}
