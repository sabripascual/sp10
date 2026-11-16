"use client";

import { useEffect, useRef } from "react";

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 7) * 0.08,
  size: 6 + (i % 4) * 3,
  dur: 1.4 + (i % 5) * 0.2,
}));

/** Pantalla de festejo al guardar: ¡Esaaa! Se cierra sola o con un toque. */
export function Celebration({
  emoji,
  apodo,
  detail,
  onDone,
}: {
  emoji: string;
  apodo: string;
  detail?: string;
  onDone: () => void;
}) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    navigator.vibrate?.(60);
    const t = setTimeout(() => done.current(), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Cerrar"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-black/95 px-8 text-center animate-in fade-in duration-200"
    >
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="pointer-events-none absolute -top-4 rounded-sm bg-accent"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 1.6,
            animation: `ringo-fall ${c.dur}s ${c.delay}s ease-in forwards`,
          }}
        />
      ))}
      <span className="text-8xl animate-in zoom-in-50 duration-300">{emoji}</span>
      <p className="mt-6 text-6xl font-black tracking-tight text-accent animate-in slide-in-from-bottom-4 duration-300">¡Esaaa!</p>
      <p className="mt-3 text-2xl font-extrabold">Así me gusta, {apodo}</p>
      {detail && <p className="mt-2 text-sm text-muted">{detail}</p>}
    </button>
  );
}
