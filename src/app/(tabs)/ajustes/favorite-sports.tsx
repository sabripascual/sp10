"use client";

import { useState } from "react";
import { ALL_TYPES, MAX_FAVORITES, TYPE_EMOJI, TYPE_LABEL, favoritesOf, type WorkoutType } from "@/lib/training-types";
import { cn } from "@/lib/utils";

/** Elegir hasta 4 deportes frecuentes (el orden en que los tocás es el orden en Hoy). */
export function FavoriteSportsPicker({ initial }: { initial: string[] | null }) {
  const [picked, setPicked] = useState<WorkoutType[]>(favoritesOf(initial));
  const toggle = (t: WorkoutType) =>
    setPicked((cur) =>
      cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : cur.length < MAX_FAVORITES ? [...cur, t] : cur,
    );
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {ALL_TYPES.filter((t) => t !== "otro").map((t) => {
          const on = picked.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={cn(
                "flex h-12 items-center justify-between rounded-xl px-3 text-sm font-bold transition-colors",
                on ? "bg-accent text-accent-fg" : "bg-bg text-fg",
                !on && picked.length >= MAX_FAVORITES && "opacity-40",
              )}
            >
              <span>
                {TYPE_EMOJI[t]} {TYPE_LABEL[t]}
              </span>
              {on && <span className="text-xs">{picked.indexOf(t) + 1}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">{picked.length}/{MAX_FAVORITES} elegidos. Guardá abajo para aplicar.</p>
      <input type="hidden" name="favorite_sports" value={picked.join(",")} />
    </div>
  );
}
