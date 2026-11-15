"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { endFast, resumeFast, startFast } from "@/app/(tabs)/ayuno/actions";
import type { FastView } from "@/lib/fast-data";
import { cn } from "@/lib/utils";
import { clock, hour, humanDuration } from "./format";
import { useNow } from "./use-now";

/**
 * Contador en vivo con botón rápido de Empezar / Terminar.
 * El cambio se ve al instante (optimista) y después confirma el servidor.
 * `compact` es la versión para la tarjeta de Hoy.
 */
export function FastTimer({ view: serverView, compact = false }: { view: FastView; compact?: boolean }) {
  const [optimistic, setOptimistic] = useState<{ base: string; view: FastView } | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // El estado optimista vale hasta que llega una vista nueva del servidor.
  const serverKey = `${serverView.phase}|${serverView.startISO}|${serverView.endISO}`;
  const view = optimistic && optimistic.base === serverKey ? optimistic.view : serverView;

  const now = useNow(view.nowISO, [view.endISO, view.nextStartISO]);
  const startMs = new Date(view.startISO).getTime();
  const end = new Date(view.endISO).getTime();
  const nextStart = new Date(view.nextStartISO).getTime();
  const tz = view.timezone;
  const baseMs = view.baseHours * 3_600_000;

  const run = (next: FastView, action: () => Promise<{ error?: string }>) => {
    setError(null);
    setOptimistic({ base: serverKey, view: next });
    start(async () => {
      const res = await action();
      if (res.error) {
        setOptimistic(null);
        setError(res.error);
      }
    });
  };

  const quickStart = () => {
    const t = Date.now();
    run(
      { ...view, phase: "fasting", startISO: new Date(t).toISOString(), endISO: new Date(t + baseMs).toISOString(), extraHours: 0, canResume: false },
      startFast,
    );
  };
  const quickEnd = () => {
    const t = Date.now();
    run(
      {
        ...view,
        phase: "eating",
        endISO: new Date(t).toISOString(),
        lastStatus: t - startMs + 10 * 60_000 < baseMs ? "broken" : "ok",
        nextStartISO: new Date(startMs + 24 * 3_600_000).toISOString(),
        canResume: true,
        canExtend: false,
      },
      endFast,
    );
  };
  const undo = () => run({ ...view, phase: "fasting", canResume: false }, resumeFast);

  let label: string;
  let big: string;
  let detail: string;
  let progress: number | null = null;

  if (view.phase === "fasting") {
    label = view.extraHours > 0 ? `Ayunando · +${view.extraHours} h` : "Ayunando";
    big = clock(now - startMs);
    progress = Math.min((now - startMs) / (end - startMs), 1);
    detail = `Termina a las ${hour(view.endISO, tz)} · faltan ${humanDuration(end - now)}`;
  } else {
    label = "Ventana abierta";
    big = clock(nextStart - now);
    const last =
      view.lastStatus === "broken"
        ? `El último lo cortaste a las ${hour(view.endISO, tz)}. Cero drama.`
        : `Último ayuno: ${humanDuration(end - startMs)}. ¡Bien ahí!`;
    detail = `${last} Se cierra a las ${hour(view.nextStartISO, tz)}.`;
  }

  const quick = (
    <div className={cn("flex items-center gap-2", compact ? "absolute right-4 top-4" : "absolute right-4 top-4")}>
      {view.phase === "eating" && view.canResume && (
        <button onClick={undo} disabled={pending} className="text-xs font-bold text-muted underline">
          Deshacer
        </button>
      )}
      <button
        onClick={view.phase === "fasting" ? quickEnd : quickStart}
        disabled={pending}
        className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-black text-accent-fg transition-transform active:scale-95 disabled:opacity-60"
      >
        {view.phase === "fasting" ? "■ Terminar" : "▶ Empezar"}
      </button>
    </div>
  );

  const body = (
    <>
      <p className="pr-28 text-sm font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("font-black tabular-nums tracking-tight", compact ? "mt-1 text-4xl" : "mt-3 text-6xl")}>{big}</p>
      {progress !== null && (
        <div
          className={cn("overflow-hidden rounded-full bg-muted/40", compact ? "mt-3 h-2" : "mt-5 h-3")}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <p className={cn("text-muted", compact ? "mt-2 text-sm" : "mt-3")}>{detail}</p>
      {error && <p className="mt-2 text-sm font-bold text-fg">{error}</p>}
    </>
  );

  return (
    <div className={cn("relative rounded-2xl bg-surface", compact ? "p-5" : "p-6 text-left")}>
      {compact ? (
        <Link href="/ayuno" className="block active:opacity-80">
          {body}
        </Link>
      ) : (
        body
      )}
      {quick}
    </div>
  );
}
