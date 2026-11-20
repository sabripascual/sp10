"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { endFast, extendFast, resumeFast, startFast } from "@/app/(tabs)/ayuno/actions";
import { EndAtSheet } from "./end-at-sheet";
import { RestartSheet } from "./restart-sheet";
import type { FastView } from "@/lib/fast-data";
import { cn } from "@/lib/utils";
import { clock, hour, humanDuration } from "./format";
import { FAST_STAGES, fastStage } from "@/lib/fast-stages";
import { useNow } from "./use-now";

/**
 * Contador en vivo con botón rápido de Empezar / Terminar.
 * El cambio se ve al instante (optimista) y después confirma el servidor.
 * `compact` es la versión para la tarjeta de Hoy.
 */
export function FastTimer({
  view: serverView,
  compact = false,
  streak,
}: {
  view: FastView;
  compact?: boolean;
  /** Si viene, muestra la racha de ayuno dentro de la tarjeta. */
  streak?: number;
}) {
  const [optimistic, setOptimistic] = useState<{ base: string; view: FastView } | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [endAtOpen, setEndAtOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
      () => endFast(),
    );
  };
  const keepGoing = () => {
    const t = Date.now();
    run({ ...view, phase: "fasting", endISO: new Date(t + 3_600_000).toISOString(), canResume: false }, () => extendFast(1));
  };
  const undo = () => run({ ...view, phase: "fasting", canResume: false }, resumeFast);

  let label: string;
  let big: string;
  let detail: string;
  let progress: number | null = null;

  const isFasting = view.phase === "fasting" || view.phase === "overtime";

  if (view.phase === "overtime") {
    label = "Meta cumplida · ¿terminaste?";
    big = clock(now - startMs);
    progress = 1;
    detail = `Llegaste a las ${hour(view.endISO, tz)}. Llevás ${humanDuration(now - end)} de yapa.`;
  } else if (view.phase === "fasting") {
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
        onClick={isFasting ? quickEnd : quickStart}
        disabled={pending}
        className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-black text-accent-fg transition-transform active:scale-95 disabled:opacity-60"
      >
        {view.phase === "overtime" ? "■ Terminé" : isFasting ? "■ Terminar" : "▶ Empezar"}
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
      {isFasting && <StageInfo elapsedMs={now - startMs} compact={compact} />}
      {streak !== undefined && (
        <p className={cn("flex items-center gap-2 border-t border-muted/30 font-bold", compact ? "mt-3 pt-3 text-sm" : "mt-4 pt-4")}>
          <span className={cn("text-xl font-black tabular-nums", streak > 0 && "text-accent")}>🔥 {streak}</span>
          <span className="text-muted">
            {streak === 0 ? "Hoy arranca la racha" : `${streak === 1 ? "día" : "días"} de racha al hilo`}
          </span>
        </p>
      )}
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
      {view.phase === "overtime" && (
        <div className="mt-4 space-y-2 rounded-xl bg-bg p-3">
          <p className="text-sm font-bold">¿Terminaste o seguís? 🐶</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={quickEnd} disabled={pending} className="h-11 rounded-xl bg-accent text-sm font-black text-accent-fg active:scale-95">
              Terminé
            </button>
            <button onClick={() => setEndAtOpen(true)} disabled={pending} className="h-11 rounded-xl bg-surface text-sm font-bold active:scale-95">
              A otra hora
            </button>
            <button onClick={keepGoing} disabled={pending} className="h-11 rounded-xl bg-surface text-sm font-bold active:scale-95">
              Sigo +1 h
            </button>
          </div>
        </div>
      )}
      {view.phase === "fasting" && (
        <button
          onClick={() => setRestartOpen(true)}
          disabled={pending}
          className="mt-3 text-xs font-bold text-muted underline underline-offset-2"
        >
          ↺ ¿Recién arrancás? Reiniciar desde ahora
        </button>
      )}
      {notice && <p className="mt-3 text-sm font-bold">{notice}</p>}
      {quick}
      <EndAtSheet open={endAtOpen} onOpenChange={setEndAtOpen} timezone={tz} onDone={setNotice} />
      <RestartSheet
        open={restartOpen}
        onOpenChange={setRestartOpen}
        prevDate={view.restartPrevDate}
        baseHours={view.baseHours}
        timezone={tz}
        onDone={setNotice}
      />
    </div>
  );
}

/** Etapa del ayuno según el tiempo transcurrido (aprox.). */
function StageInfo({ elapsedMs, compact }: { elapsedMs: number; compact: boolean }) {
  const { index, current, next, msToNext } = fastStage(elapsedMs);
  const nextText = next && msToNext !== null ? `Próxima: ${next.emoji} ${next.name} en ${humanDuration(msToNext)}` : "Llegaste a la última etapa";

  if (compact) {
    return (
      <p className="mt-2 text-sm">
        <span className="font-bold">
          {current.emoji} {current.name}
        </span>
        <span className="text-muted"> · {next && msToNext !== null ? `${next.emoji} en ${humanDuration(msToNext)}` : "última etapa"}</span>
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-3 rounded-xl bg-bg p-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{current.emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Etapa {index + 1} de {FAST_STAGES.length}</p>
          <p className="text-xl font-black leading-tight">{current.name}</p>
          <p className="text-sm text-muted">{current.text}</p>
        </div>
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {FAST_STAGES.map((st, i) => (
          <li
            key={st.name}
            title={`${st.name} (${st.fromH} h)`}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg py-1.5",
              i === index ? "bg-accent text-accent-fg" : i < index ? "bg-surface" : "opacity-40",
            )}
          >
            <span className="text-lg leading-none">{st.emoji}</span>
            <span className="text-[10px] font-bold">{st.fromH}h</span>
          </li>
        ))}
      </ol>
      <p className="text-sm font-bold">{nextText}</p>
      <p className="text-[11px] text-muted">Tiempos aproximados: cada cuerpo tiene su ritmo.</p>
    </div>
  );
}
