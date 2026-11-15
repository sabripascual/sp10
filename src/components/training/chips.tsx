"use client";

import { cn } from "@/lib/utils";

/** Fila de opciones de un toque. La elegida va en amarillo. */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-12 rounded-xl px-2 text-sm font-bold transition-colors",
            value === o.value ? "bg-accent text-accent-fg" : "bg-bg text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
