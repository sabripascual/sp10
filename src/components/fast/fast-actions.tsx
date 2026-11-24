"use client";

import { useState, useTransition } from "react";
import { adjustStart, endFast, extendFast, resumeFast, startFast } from "@/app/(tabs)/ayuno/actions";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { FastView } from "@/lib/fast-data";
import { humanDuration } from "./format";
import { EndAtSheet } from "./end-at-sheet";

const TOLERANCE_MS = 10 * 60_000;

export function FastActions({ view }: { view: FastView }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmMissing, setConfirmMissing] = useState<number | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [endAtOpen, setEndAtOpen] = useState(false);
  const [adjustTime, setAdjustTime] = useState("");

  const openAdjust = () => {
    const ref = view.phase === "eating" ? new Date() : new Date(view.startISO);
    setAdjustTime(formatInTimeZone(ref, view.timezone, "HH:mm"));
    setAdjustOpen(true);
  };
  const saveAdjust = () =>
    start(async () => {
      const res = await adjustStart(adjustTime);
      if (res.error) return setMessage(res.error);
      setAdjustOpen(false);
      setMessage("Listo, hora de inicio corregida. El fin se recalculó.");
    });

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
    else run(() => endFast());
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
      {view.phase === "overtime" ? null : view.phase === "fasting" ? (
        <>
          <Button variant="primary" size="lg" className="w-full" disabled={pending} onClick={onEnd}>
            Terminar ayuno
          </Button>
          <Button variant="ghost" className="w-full text-muted" disabled={pending} onClick={() => setEndAtOpen(true)}>
            Ya terminé, pero a otra hora
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
          <Button variant="primary" size="lg" className="w-full" disabled={pending} onClick={() => run(startFast)}>
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

      {view.phase === "eating" && (
        <Button variant="ghost" className="w-full text-muted" disabled={pending} onClick={openAdjust}>
          🕐 ¿Ya empezaste? Poné la hora
        </Button>
      )}

      {message && <p className="text-center text-sm">{message}</p>}

      <EndAtSheet open={endAtOpen} onOpenChange={setEndAtOpen} timezone={view.timezone} onDone={setMessage} />

      <Sheet open={adjustOpen} onOpenChange={setAdjustOpen}>
        <SheetContent>
          <SheetTitle>¿A qué hora empezaste?</SheetTitle>
          <SheetDescription className="mb-5">
            Ponés la hora real y el fin se recalcula solo ({view.baseHours} h después).
          </SheetDescription>
          <input
            type="time"
            value={adjustTime}
            onChange={(e) => setAdjustTime(e.target.value)}
            className="h-14 w-full rounded-2xl bg-bg px-4 text-2xl font-black text-fg outline-none focus:ring-2 focus:ring-accent"
          />
          <Button variant="primary" size="lg" className="mt-4 w-full" disabled={pending || !adjustTime} onClick={saveAdjust}>
            Guardar hora
          </Button>
        </SheetContent>
      </Sheet>

      <Sheet open={confirmMissing !== null} onOpenChange={(o) => !o && setConfirmMissing(null)}>
        <SheetContent>
          <SheetTitle>¿Terminás ya?</SheetTitle>
          <SheetDescription className="mb-6">
            Te faltan {humanDuration(confirmMissing ?? 0)} para las {view.baseHours} h. Sin culpa: anoto la
            hora y la próxima vamos con todo.
          </SheetDescription>
          <div className="grid gap-3">
            <SheetClose asChild>
              <Button variant="primary" size="lg" onClick={() => run(() => endFast())}>
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
