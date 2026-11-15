"use client";

import Link from "next/link";
import type { FastView } from "@/lib/fast-data";
import { cn } from "@/lib/utils";
import { clock, hour, humanDuration } from "./format";
import { useNow } from "./use-now";

/** Contador en vivo. `compact` es la versión para la tarjeta de Hoy. */
export function FastTimer({ view, compact = false }: { view: FastView; compact?: boolean }) {
  const now = useNow(view.nowISO, [view.endISO, view.nextStartISO]);
  const start = new Date(view.startISO).getTime();
  const end = new Date(view.endISO).getTime();
  const nextStart = new Date(view.nextStartISO).getTime();
  const tz = view.timezone;

  let label: string;
  let big: string;
  let detail: string;
  let progress: number | null = null;

  if (view.phase === "fasting") {
    label = view.extraHours > 0 ? `Ayunando · extendido +${view.extraHours} h` : "Ayunando";
    big = clock(now - start);
    progress = Math.min((now - start) / (end - start), 1);
    detail = `Termina a las ${hour(view.endISO, tz)} · faltan ${humanDuration(end - now)}`;
  } else {
    label = "Ventana abierta";
    big = clock(nextStart - now);
    const last =
      view.lastStatus === "broken"
        ? `El último lo cortaste a las ${hour(view.endISO, tz)}. Cero drama.`
        : `Último ayuno: ${humanDuration(end - start)}. ¡Bien ahí!`;
    detail = `${last} Se cierra a las ${hour(view.nextStartISO, tz)}.`;
  }

  const body = (
    <>
      <p className="text-sm font-bold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "font-extrabold tabular-nums tracking-tight",
          compact ? "mt-1 text-4xl" : "mt-2 text-6xl",
        )}
      >
        {big}
      </p>
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
    </>
  );

  return compact ? (
    <Link href="/ayuno" className="block rounded-2xl bg-surface p-5 active:scale-[0.99]">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl bg-surface p-6 text-center">{body}</div>
  );
}
