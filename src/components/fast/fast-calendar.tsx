"use client";

import { useState, useTransition } from "react";
import { setFastDay, type DayChoice } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { DayMark } from "@/lib/fast";
import { cn } from "@/lib/utils";

const styles: Record<DayMark, string> = {
  ok: "bg-fg text-bg",
  extended: "bg-fg text-bg ring-2 ring-fg ring-offset-2 ring-offset-surface",
  event: "bg-muted text-fg",
  broken: "border border-muted text-muted",
  pending: "border border-dashed border-muted text-fg",
  none: "border border-muted/30 text-muted/60",
};

const legend: [DayMark, string][] = [
  ["ok", "Cumplido"],
  ["extended", "Extendido"],
  ["event", "Evento"],
  ["broken", "Cortado"],
  ["none", "Sin cargar"],
];

const choices: [DayChoice, string][] = [
  ["ok", "Cumplido"],
  ["extend1", "Extendido +1 h"],
  ["extend2", "Extendido +2 h"],
  ["broken", "Lo corté"],
];

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function dayLabel(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

type Day = { date: string; mark: DayMark; editable: boolean };

export function FastCalendar({ days }: { days: Day[] }) {
  const [selected, setSelected] = useState<Day | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const choose = (choice: DayChoice) =>
    start(async () => {
      const res = await setFastDay(selected!.date, choice);
      if (res.error) setError(res.error);
      else setSelected(null);
    });

  return (
    <div>
      <ul className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <li key={day.date}>
            <button
              type="button"
              disabled={!day.editable}
              onClick={() => {
                setError(null);
                setSelected(day);
              }}
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

      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetTitle>Ayuno del {selected && dayLabel(selected.date)}</SheetTitle>
          <SheetDescription className="mb-5">La noche que arrancó ese día. ¿Cómo te fue?</SheetDescription>
          <div className="grid grid-cols-2 gap-3">
            {choices.map(([choice, label]) => (
              <Button key={choice} size="lg" className="bg-bg" disabled={pending} onClick={() => choose(choice)}>
                {label}
              </Button>
            ))}
          </div>
          {selected?.mark !== "none" && (
            <Button variant="ghost" className="mt-3 w-full text-muted" disabled={pending} onClick={() => choose("clear")}>
              Borrar lo cargado
            </Button>
          )}
          {error && <p className="mt-3 text-center text-sm">{error}</p>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
