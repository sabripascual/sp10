import type { DayPlan } from "@/lib/training-types";
import { TYPE_EMOJI } from "@/lib/training-types";
import { DAY_SHORT } from "@/lib/week";
import { cn } from "@/lib/utils";

/** Semana de lunes a domingo: lo hecho en blanco, lo sugerido punteado. */
export function WeekStrip({ week }: { week: DayPlan[] }) {
  return (
    <ul className="grid grid-cols-7 gap-1.5">
      {week.map((d) => {
        const did = d.workouts.length > 0;
        return (
          <li
            key={d.date}
            className={cn(
              "flex min-h-20 flex-col items-center gap-1 rounded-xl py-2 text-xs",
              did ? "bg-fg text-bg" : "border border-muted/40 text-muted",
              d.isToday && !did && "border-2 border-fg text-fg",
            )}
          >
            <span className="font-extrabold">{DAY_SHORT[d.isoDay - 1]}</span>
            <span className="text-[10px] opacity-70">{Number(d.date.slice(8))}</span>
            <span className="flex flex-wrap justify-center text-sm leading-none">
              {d.workouts.map((w) => (
                <span key={w.id}>{TYPE_EMOJI[w.type]}</span>
              ))}
              {!did && d.planned && !d.skipped && <span className="opacity-40">{TYPE_EMOJI[d.planned]}</span>}
              {d.skipped && !did && <span className="text-[10px]">—</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
