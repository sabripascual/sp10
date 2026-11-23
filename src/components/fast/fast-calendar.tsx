"use client";

import { useState } from "react";
import { FastDaySheet } from "./fast-day-sheet";
import type { DayMark } from "@/lib/fast";
import { cn } from "@/lib/utils";

// Tres colores: blanco cumplido, amarillo extendido, violeta derrape. Cortado solo con borde.
const styles: Record<DayMark, string> = {
  ok: "bg-fg text-bg",
  extended: "bg-accent text-accent-fg",
  event: "bg-event text-bg",
  broken: "border border-muted text-muted",
  pending: "border border-dashed border-muted text-fg",
  none: "border border-muted/30 text-muted/60",
};

const legend: [DayMark, string][] = [
  ["ok", "Cumplido"],
  ["extended", "Extendido"],
  ["event", "Derrape"],
  ["broken", "Cortado / no lo hice"],
  ["none", "Sin cargar"],
];

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function dayLabel(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

type Day = { date: string; mark: DayMark; editable: boolean; startISO: string; endISO: string };

export function FastCalendar({ days, timezone }: { days: Day[]; timezone: string }) {
  const [selected, setSelected] = useState<Day | null>(null);

  return (
    <div>
      <ul className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <li key={day.date}>
            <button
              type="button"
              disabled={!day.editable}
              onClick={() => setSelected(day)}
              aria-label={`Ayuno del ${dayLabel(day.date)}`}
              className={cn(
                "grid aspect-square w-full place-items-center rounded-lg text-xs font-bold transition-transform active:scale-90 disabled:active:scale-100",
                styles[day.mark],
              )}
            >
              {Number(day.date.slice(8))}
            </button>
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
      <p className="mt-3 text-xs text-muted">Tocá un día para cargarlo o corregirlo.</p>

      <FastDaySheet fast={selected} timezone={timezone} onClose={() => setSelected(null)} />
    </div>
  );
}
