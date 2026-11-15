"use client";

import { useState, useTransition } from "react";
import { endFast, extendFast, resumeFast, startFast } from "@/app/(tabs)/ayuno/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { FastView } from "@/lib/fast-data";
import { humanDuration } from "./format";

const TOLERANCE_MS = 10 * 60_000;

export function FastActions({ view }: { view: FastView }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmMissing, setConfirmMissing] = useState<number | null>(null);

  const run = (fn: () => Promise<{ error?: string; status?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.error) return setMessage(res.error);
      setMessage(
        res.status === "ok"
          ? "¡Cumplido! Andá a desayunar como la campeona que sos."
          : res.status === "extended"
            ? "¡Ayuno extendido! Sos una máquina."
            : null,
      );
    });

  const onEnd = () => {
    const elapsed = Date.now() - new Date(view.startISO).getTime();
    const missing = view.baseHours * 3_600_000 - elapsed;
    if (missing > TOLERANCE_MS) setConfirmMissing(missing);
    else run(endFast);
  };

  const extendButtons = (
    <div className="grid grid-cols-2 gap-3">
      <Button disabled={pending} onClick={() => run(() => extendFast(1))}>
        +1 h
      </Button>
      <Button disabled={pending} onClick={() => run(() => extendFast(2))}>
        +2 h
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {view.phase === "fasting" ? (
        <>
          <Button size="lg" className="w-full" disabled={pending} onClick={onEnd}>
            Terminar ayuno
          </Button>
          {view.canExtend && (
            <>
              <p className="pt-1 text-center text-sm text-muted">¿Vas por más? Extendelo</p>
              {extendButtons}
            </>
          )}
        </>
      ) : (
        <>
          <Button size="lg" className="w-full" disabled={pending} onClick={() => run(startFast)}>
            Empezar ayuno ahora
          </Button>
          {view.canResume && (
            <Button variant="ghost" className="w-full text-muted" disabled={pending} onClick={() => run(resumeFast)}>
              Me equivoqué, sigo ayunando
            </Button>
          )}
          {view.canExtend && (
            <>
              <p className="pt-1 text-center text-sm text-muted">¿Seguís en ayunas? Estiralo</p>
              {extendButtons}
            </>
          )}
        </>
      )}

      {message && <p className="text-center text-sm">{message}</p>}

      <Sheet open={confirmMissing !== null} onOpenChange={(o) => !o && setConfirmMissing(null)}>
        <SheetContent>
          <SheetTitle>¿Terminás ya?</SheetTitle>
          <SheetDescription className="mb-6">
            Te faltan {humanDuration(confirmMissing ?? 0)} para las {view.baseHours} h. Sin culpa: anoto la
            hora y la próxima vamos con todo.
          </SheetDescription>
          <div className="grid gap-3">
            <SheetClose asChild>
              <Button size="lg" className="bg-bg" onClick={() => run(endFast)}>
                Sí, terminar
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
    </div>
  );
}
