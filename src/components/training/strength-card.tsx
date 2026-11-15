"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RegisterSheet } from "./register-sheet";

export function StrengthCard({
  done,
  goal,
  runMinutes,
  today,
}: {
  done: number;
  goal: number;
  runMinutes: number;
  today: string;
}) {
  const left = Math.max(goal - done, 0);
  return (
    <Card className="flex items-center gap-5">
      <ProgressRing value={done} max={goal} size={104}>
        <span className="text-3xl font-black">
          {done}/{goal}
        </span>
      </ProgressRing>
      <div className="min-w-0 flex-1 space-y-2">
        <CardTitle>Fuerza</CardTitle>
        <CardDescription>
          {left === 0 ? "¡Meta cumplida! Sos una máquina." : `Te ${left === 1 ? "falta 1" : `faltan ${left}`} esta semana.`}
          {runMinutes > 0 && ` · ${runMinutes} min corridos`}
        </CardDescription>
        {left > 0 && (
          <RegisterSheet today={today} initialType="fuerza" label="+ Fuerza" variant="secondary" size="sm" className="bg-bg" />
        )}
      </div>
    </Card>
  );
}
