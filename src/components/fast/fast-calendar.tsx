import type { DayMark } from "@/lib/fast";
import { cn } from "@/lib/utils";

const styles: Record<DayMark, string> = {
  ok: "bg-fg text-bg",
  extended: "bg-fg text-bg ring-2 ring-fg ring-offset-2 ring-offset-surface",
  event: "bg-muted text-fg",
  broken: "border border-muted text-muted",
  pending: "border border-dashed border-muted text-fg",
  none: "text-muted/50",
};

const legend: [DayMark, string][] = [
  ["ok", "Cumplido"],
  ["extended", "Extendido"],
  ["event", "Evento"],
  ["broken", "Cortado"],
];

export function FastCalendar({ days }: { days: { date: string; mark: DayMark }[] }) {
  return (
    <div>
      <ul className="grid grid-cols-7 gap-2">
        {days.map(({ date, mark }) => (
          <li
            key={date}
            title={date}
            className={cn("grid aspect-square place-items-center rounded-lg text-xs font-bold", styles[mark])}
          >
            {Number(date.slice(8))}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        {legend.map(([mark, label]) => (
          <li key={mark} className="flex items-center gap-1.5">
            <span className={cn("inline-block size-3 rounded", styles[mark])} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
