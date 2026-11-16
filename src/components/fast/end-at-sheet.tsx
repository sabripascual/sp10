"use client";

import { useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { endFast } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/** "Terminé a las…": cerrar el ayuno con la hora real en que comiste. */
export function EndAtSheet({
  open,
  onOpenChange,
  timezone,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  timezone: string;
  onDone?: (msg: string) => void;
}) {
  const [time, setTime] = useState(() => formatInTimeZone(new Date(), timezone, "HH:mm"));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      const res = await endFast(time);
      if (res.error) return setError(res.error);
      setError(null);
      onOpenChange(false);
      onDone?.(`Anotado: ${String(res.hours).replace(".", ",")} h de ayuno. ¡Bien ahí!`);
    });

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setTime(formatInTimeZone(new Date(), timezone, "HH:mm"));
        onOpenChange(o);
      }}
    >
      <SheetContent>
        <SheetTitle>¿A qué hora terminaste?</SheetTitle>
        <SheetDescription className="mb-5">La hora de tu primera comida. Así queda con tus horas reales.</SheetDescription>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-14 w-full rounded-2xl bg-bg px-4 text-2xl font-black text-fg outline-none focus:ring-2 focus:ring-accent"
        />
        <Button variant="primary" size="lg" className="mt-4 w-full" disabled={pending || !time} onClick={save}>
          Guardar
        </Button>
        {error && <p className="mt-3 text-center text-sm font-bold">{error}</p>}
      </SheetContent>
    </Sheet>
  );
}
