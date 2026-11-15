"use client";

import { useState, useTransition } from "react";
import { breakFast, extendFast, undoBreak, type FastActionResult } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { FastView } from "@/lib/fast-data";

export function FastActions({ view }: { view: FastView }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<FastActionResult>) =>
    start(async () => {
      const res = await fn();
      setError(res.error ?? null);
    });

  return (
    <div className="space-y-3">
      {view.canExtend && (
        <>
          {view.phase === "eating" && (
            <p className="text-center text-sm text-muted">¿Seguís en ayunas? Estirala un toque.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" disabled={pending} onClick={() => run(() => extendFast(1))}>
              Extender +1 h
            </Button>
            <Button size="lg" disabled={pending} onClick={() => run(() => extendFast(2))}>
              Extender +2 h
            </Button>
          </div>
        </>
      )}

      {view.phase === "fasting" && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="w-full" disabled={pending}>
              Lo rompí
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>¿Lo cortaste?</SheetTitle>
            <SheetDescription className="mb-6">
              Sin culpa: anoto la hora y mañana seguimos con todo.
            </SheetDescription>
            <div className="grid gap-3">
              <SheetClose asChild>
                <Button size="lg" className="bg-bg" onClick={() => run(breakFast)}>
                  Sí, lo rompí
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="ghost" size="lg">
                  No, sigo firme
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {view.phase === "broken" && (
        <Button variant="ghost" className="w-full text-muted" disabled={pending} onClick={() => run(undoBreak)}>
          Me equivoqué, no lo rompí
        </Button>
      )}

      {error && <p className="text-center text-sm">{error}</p>}
    </div>
  );
}
