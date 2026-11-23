"use client";

import { useEffect, useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { setFastDay, setFastTimes, type DayChoice } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { DayMark } from "@/lib/fast";
import { shortDate } from "@/lib/week";

export type EditableFast = { date: string; startISO: string; endISO: string; mark: DayMark };

const choices: [DayChoice, string][] = [
  ["ok", "✅ Cumplido"],
  ["broken", "✂️ No lo hice"],
  ["extend1", "💪 +1 h"],
  ["extend2", "💪 +2 h"],
];

const timeClass = "h-12 w-full rounded-xl bg-bg px-3 text-lg font-black text-fg outline-none focus:ring-2 focus:ring-accent";

/** Corregir un ayuno que ya pasó: estado de un toque u horas reales de inicio y fin. */
export function FastDaySheet({
  fast,
  timezone,
  onClose,
}: {
  fast: EditableFast | null;
  timezone: string;
  onClose: () => void;
}) {
  const [startT, setStartT] = useState("");
  const [endT, setEndT] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fast) return;
    setStartT(formatInTimeZone(new Date(fast.startISO), timezone, "HH:mm"));
    setEndT(formatInTimeZone(new Date(fast.endISO), timezone, "HH:mm"));
    setError(null);
  }, [fast, timezone]);

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else onClose();
    });

  return (
    <Sheet open={fast !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-h-[92dvh] overflow-y-auto">
        <SheetTitle>Ayuno del {fast && shortDate(fast.date)}</SheetTitle>
        <SheetDescription className="mb-4">El que arrancó esa noche. ¿Cómo te fue en realidad?</SheetDescription>

        <div className="grid grid-cols-2 gap-2">
          {choices.map(([choice, label]) => (
            <Button key={choice} className="bg-bg" disabled={pending} onClick={() => run(() => setFastDay(fast!.date, choice))}>
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-5 space-y-2 rounded-xl bg-bg/60 p-3">
          <p className="text-sm font-bold">O cargá las horas reales</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted">
              Empecé
              <input type="time" value={startT} onChange={(e) => setStartT(e.target.value)} className={timeClass} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Terminé
              <input type="time" value={endT} onChange={(e) => setEndT(e.target.value)} className={timeClass} />
            </label>
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={pending || !startT || !endT}
            onClick={() => run(() => setFastTimes(fast!.date, startT, endT))}
          >
            Guardar horas
          </Button>
        </div>

        {fast?.mark !== "none" && (
          <Button variant="ghost" className="mt-2 w-full text-muted" disabled={pending} onClick={() => run(() => setFastDay(fast!.date, "clear"))}>
            Volver al horario (borrar lo cargado)
          </Button>
        )}
        {error && <p className="mt-2 text-center text-sm font-bold">{error}</p>}
      </SheetContent>
    </Sheet>
  );
}
