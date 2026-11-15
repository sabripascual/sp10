"use client";

import { useRef, useState } from "react";
import { fmt, type Trend } from "@/lib/body";

const TREND: Record<Trend, string> = { bajando: "↓ Bajando", estable: "→ Estable", subiendo: "↑ Subiendo" };

/** Peso con "número oculto": muestra la tendencia y el número solo mientras mantenés apretado. */
export function WeightValue({ weight, trend, hidden }: { weight: number | null; trend: Trend | null; hidden: boolean }) {
  const [reveal, setReveal] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (weight === null) return <p className="text-muted">Sin peso cargado</p>;

  const trendText = trend ? TREND[trend] : "Primera marca";
  if (!hidden) {
    return (
      <div>
        <p className="text-4xl font-black tabular-nums">{fmt(weight)} kg</p>
        <p className="text-sm text-muted">{trendText}</p>
      </div>
    );
  }

  const start = () => (timer.current = setTimeout(() => setReveal(true), 400));
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setReveal(false);
  };

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="select-none text-left [-webkit-touch-callout:none]"
    >
      <p className="text-4xl font-black tabular-nums">{reveal ? `${fmt(weight)} kg` : trendText}</p>
      <p className="text-sm text-muted">{reveal ? trendText : "Mantené apretado para ver el número"}</p>
    </button>
  );
}
