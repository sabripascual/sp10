import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import type { DayPlan } from "@/lib/training-types";
import { RegisterSheet } from "./register-sheet";
import { WeekStrip } from "./week-strip";

/** Resumen de entrenos de la semana: Fierritos X/meta, carrera y + Registrar. */
export function TrainingCard({
  week,
  strengthDone,
  goal,
  runMinutes,
  runKcal,
  today,
  weightKg,
}: {
  week: DayPlan[];
  strengthDone: number;
  goal: number;
  runMinutes: number;
  runKcal: number;
  today: string;
  weightKg: number;
}) {
  const left = Math.max(goal - strengthDone, 0);
  const others = week.flatMap((d) => d.workouts).filter((w) => w.type !== "fuerza" && w.type !== "correr").length;
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={strengthDone} max={goal} size={92} stroke={9}>
          <span className="text-2xl font-black">
            {strengthDone}/{goal}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle>Fierritos 💪🏻</CardTitle>
          <CardDescription>
            {left === 0 ? "¡Meta de la semana cumplida!" : `Te ${left === 1 ? "falta 1" : `faltan ${left}`} esta semana.`}
          </CardDescription>
          <p className="text-sm">
            🏃‍♀️ {runMinutes > 0 ? `${runMinutes} min${runKcal ? ` · ≈ ${runKcal} kcal` : ""}` : "Sin carrera todavía"}
            {others > 0 && <span className="text-muted"> · +{others} más</span>}
          </p>
        </div>
      </div>
      <WeekStrip week={week} />
      <RegisterSheet today={today} weightKg={weightKg} className="w-full" />
    </Card>
  );
}
