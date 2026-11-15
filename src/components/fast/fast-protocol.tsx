"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PROTOCOLS, fastHours, toMin, toTime } from "@/lib/fast-protocol";

const inputClass =
  "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

/** Selector de protocolo + hora de última comida. Emite fast_start y fast_end. */
export function FastProtocolPicker({ start: initialStart, end: initialEnd }: { start: string; end: string }) {
  const initialHours = fastHours(initialStart, initialEnd);
  const [start, setStart] = useState(initialStart);
  const [hours, setHours] = useState<number | "custom">(
    PROTOCOLS.some((p) => p.hours === initialHours) ? initialHours : "custom",
  );
  const [customEnd, setCustomEnd] = useState(initialEnd);
  const end = hours === "custom" ? customEnd : toTime(toMin(start) + hours * 60);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {PROTOCOLS.map((p) => (
          <button
            key={p.hours}
            type="button"
            onClick={() => setHours(p.hours)}
            className={cn(
              "rounded-xl px-2 py-3 text-center transition-colors",
              hours === p.hours ? "bg-accent text-accent-fg" : "bg-bg text-fg",
            )}
          >
            <span className="block text-lg font-extrabold">{p.label}</span>
            <span className={cn("block text-xs", hours === p.hours ? "text-accent-fg/70" : "text-muted")}>{p.hint}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setHours("custom")}
        className={cn(
          "w-full rounded-xl py-2 text-sm font-bold",
          hours === "custom" ? "bg-accent text-accent-fg" : "bg-bg text-muted",
        )}
      >
        Personalizado
      </button>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm text-muted">
          Última comida
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} required />
        </label>
        <label className="space-y-1 text-sm text-muted">
          Primera comida
          {hours === "custom" ? (
            <input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={inputClass} required />
          ) : (
            <span className="flex h-12 items-center rounded-xl bg-bg/50 px-4 text-base text-fg">{end}</span>
          )}
        </label>
      </div>
      <p className="text-sm text-muted">
        Ayunás {fastHours(start, end)} h y comés en {24 - fastHours(start, end)} h.
      </p>
      <input type="hidden" name="fast_start" value={start} />
      <input type="hidden" name="fast_end" value={end} />
    </div>
  );
}
