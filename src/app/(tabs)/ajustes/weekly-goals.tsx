"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { GOAL_KEYS, GOAL_LABEL, MAX_PER_GOAL, type GoalKey, type Goals } from "@/lib/goals";
import { cn } from "@/lib/utils";

/** "Tu semana ideal": cuántas veces por semana de cada cosa. En 0 no cuenta. */
export function WeeklyGoalsPicker({ initial }: { initial: Goals }) {
  const [goals, setGoals] = useState<Goals>(initial);
  const set = (k: GoalKey, n: number) => setGoals((g) => ({ ...g, [k]: Math.max(0, Math.min(n, MAX_PER_GOAL)) }));
  const active = GOAL_KEYS.filter((k) => (goals[k] ?? 0) > 0);

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-muted/30">
        {GOAL_KEYS.map((k) => {
          const n = goals[k] ?? 0;
          return (
            <li key={k} className="flex items-center gap-3 py-2">
              <span className={cn("flex-1 font-bold", n === 0 && "text-muted")}>
                {GOAL_LABEL[k].emoji} {GOAL_LABEL[k].label}
              </span>
              <button
                type="button"
                aria-label={`Menos ${GOAL_LABEL[k].label}`}
                onClick={() => set(k, n - 1)}
                className="grid size-9 place-items-center rounded-full bg-bg active:scale-95 disabled:opacity-30"
                disabled={n === 0}
              >
                <Minus className="size-4" />
              </button>
              <span className={cn("w-8 text-center text-lg font-black tabular-nums", n === 0 && "text-muted")}>{n === 0 ? "—" : n}</span>
              <button
                type="button"
                aria-label={`Más ${GOAL_LABEL[k].label}`}
                onClick={() => set(k, n + 1)}
                className={cn(
                  "grid size-9 place-items-center rounded-full active:scale-95 disabled:opacity-30",
                  n > 0 ? "bg-accent text-accent-fg" : "bg-bg",
                )}
                disabled={n >= MAX_PER_GOAL}
              >
                <Plus className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">
        Veces por semana (— = no cuenta).{" "}
        {active.length
          ? `${active.length} objetivo${active.length === 1 ? "" : "s"}: cada uno pesa lo mismo en tu % semanal y en tu nivel.`
          : "Elegí al menos uno."}
      </p>
      <input type="hidden" name="weekly_goals" value={JSON.stringify(goals)} />
    </div>
  );
}
