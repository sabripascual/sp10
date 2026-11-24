"use client";

import { useEffect, useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { adjustStart } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/** "Empecé a otra hora": la hora real de inicio; el fin se recalcula solo. */
export function StartAtSheet({
  open,
  onOpenChange,
  currentStartISO,
  baseHours,
  timezone,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentStartISO: string;
  baseHours: number;
  timezone: string;
  onDone?: (msg: string) => void;
}) {
  const [time, setTime] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Al abrir, arranca con la hora de inicio actual
  useEffect(() => {
    if (open) setTime(formatInTimeZone(new Date(currentStartISO), timezone, "HH:mm"));
  }, [open, currentStartISO, timezone]);

  const save = () =>
    start(async () => {
      const res = await adjustStart(time);
      if (res.error) return setError(res.error);
      setError(null);
      onOpenChange(false);
      onDone?.(`Anotado: empezaste a las ${time}. El fin se recalculó.`);
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetTitle>¿A qué hora empezaste?</SheetTitle>
        <SheetDescription className="mb-5">
          La hora de tu última comida. El fin se recalcula solo ({baseHours} h después).
        </SheetDescription>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-14 w-full rounded-2xl bg-bg px-4 text-2xl font-black text-fg outline-none focus:ring-2 focus:ring-accent"
        />
        <Button variant="primary" size="lg" className="mt-4 w-full" disabled={pending || !time} onClick={save}>
          Guardar hora
        </Button>
        {error && <p className="mt-3 text-center text-sm font-bold">{error}</p>}
      </SheetContent>
    </Sheet>
  );
}
