"use client";

import { COMP_FAST_HOURS, COMP_MINUTES, type CompPrefs, type Compensation } from "@/lib/events";
import { ALL_TYPES, TYPE_EMOJI, TYPE_LABEL } from "@/lib/training-types";
import { cn } from "@/lib/utils";
import { Chips } from "./chips";

/** Elegir cómo se compensa un derrape: entreno (deporte + minutos), horas extra de ayuno, o las dos. */
export function CompPicker({ value, onChange, fasting }: { value: CompPrefs; onChange: (v: CompPrefs) => void; fasting: boolean }) {
  const set = (patch: Partial<CompPrefs>) => onChange({ ...value, ...patch });
  const mode: Compensation = fasting ? value.mode : "workout";
  return (
    <div className="space-y-4">
      {fasting && (
        <Chips
          value={mode}
          onChange={(m) => set({ mode: m })}
          options={[
            { value: "workout", label: "Entreno" },
            { value: "fast", label: "Más ayuno" },
            { value: "both", label: "Las dos" },
          ]}
        />
      )}

      {mode !== "fast" && (
        <div className="space-y-2">
          <p className="text-sm text-muted">¿Con qué deporte?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["any", ...ALL_TYPES.filter((t) => t !== "otro")] as string[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ sport: t })}
                className={cn(
                  "h-11 rounded-xl px-1 text-xs font-bold transition-colors",
                  value.sport === t ? "bg-accent text-accent-fg" : "bg-bg text-fg",
                )}
              >
                {t === "any" ? "✨ Cualquiera" : `${TYPE_EMOJI[t as keyof typeof TYPE_EMOJI]} ${TYPE_LABEL[t as keyof typeof TYPE_LABEL]}`}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">Mínimo</p>
          <Chips
            cols={5}
            value={value.minutes}
            onChange={(m) => set({ minutes: m })}
            options={COMP_MINUTES.map((m) => ({ value: m, label: m === 0 ? "Libre" : `${m}′` }))}
          />
        </div>
      )}

      {mode !== "workout" && (
        <div className="space-y-2">
          <p className="text-sm text-muted">Horas extra de ayuno esa noche</p>
          <Chips value={value.fastHours} onChange={(h) => set({ fastHours: h })} options={COMP_FAST_HOURS.map((h) => ({ value: h, label: `+${h} h` }))} />
        </div>
      )}
    </div>
  );
}
