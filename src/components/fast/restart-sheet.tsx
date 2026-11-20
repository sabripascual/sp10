"use client";

import { useState, useTransition } from "react";
import { restartFast } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { shortDate } from "@/lib/week";
import { hour } from "./format";

/** "Recién arranco": el ayuno empieza ahora y, si querés, el anterior queda como perdido. */
export function RestartSheet({
  open,
  onOpenChange,
  prevDate,
  baseHours,
  timezone,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prevDate: string;
  baseHours: number;
  timezone: string;
  onDone?: (msg: string) => void;
}) {
  const [markLost, setMarkLost] = useState(true);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endAt = new Date(Date.now() + baseHours * 3_600_000).toISOString();

  const confirm = () =>
    start(async () => {
      const res = await restartFast(markLost);
      if (res.error) return setError(res.error);
      setError(null);
      onOpenChange(false);
      onDone?.("Arrancamos de cero. ¡Vamos con todo!");
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>¿Arrancás de cero ahora?</SheetTitle>
        <SheetDescription className="mb-5">
          El ayuno empieza ahora y termina a las {hour(endAt, timezone)} ({baseHours} h). Cero culpa: pasa en las mejores familias.
        </SheetDescription>
        <label className="flex items-center gap-3 rounded-xl bg-bg p-4">
          <input
            type="checkbox"
            checked={markLost}
            onChange={(e) => setMarkLost(e.target.checked)}
            className="size-5 accent-[#ffe900]"
          />
          <span className="text-sm">
            <span className="block font-bold">Marcar como perdido el ayuno del {shortDate(prevDate)}</span>
            <span className="block text-muted">Queda como cortado en el calendario.</span>
          </span>
        </label>
        <Button variant="primary" size="lg" className="mt-4 w-full" disabled={pending} onClick={confirm}>
          {pending ? "Arrancando…" : "Empiezo ahora"}
        </Button>
        {error && <p className="mt-3 text-center text-sm font-bold">{error}</p>}
      </SheetContent>
    </Sheet>
  );
}
