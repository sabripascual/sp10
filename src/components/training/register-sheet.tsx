"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { addWorkout } from "@/app/(tabs)/entrenos/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { shiftDate } from "@/lib/fast";
import {
  TYPE_EMOJI,
  TYPE_LABEL,
  ZONES,
  runKcal,
  type WorkoutType,
  type Zone,
  type ZoneWork,
} from "@/lib/training-types";
import { cn } from "@/lib/utils";
import { Chips } from "./chips";

const TYPES: WorkoutType[] = ["fuerza", "correr", "futbol", "padel", "otro"];
const MINUTES = [30, 45, 60, 75, 90, 120];
const DEFAULT_ZONE: ZoneWork = { exercises: 3, reps: 12, rounds: 3 };

const CHEERS: Record<WorkoutType, string> = {
  fuerza: "¡Fierritos anotados! 💪🏻",
  correr: "¡Carrera anotada! Sos otra.",
  futbol: "¡Fútbol anotado! Ni el Dibu.",
  padel: "¡Pádel anotado!",
  otro: "¡Anotado!",
};

const inputClass = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

function Stepper({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={`Menos ${label}`} onClick={() => onChange(Math.max(0, value - step))} className="grid size-7 place-items-center rounded-full bg-surface active:scale-90">
          <Minus className="size-3.5" />
        </button>
        <span className="w-7 text-center text-base font-black tabular-nums">{value}</span>
        <button type="button" aria-label={`Más ${label}`} onClick={() => onChange(value + step)} className="grid size-7 place-items-center rounded-full bg-surface active:scale-90">
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function RegisterSheet({
  today,
  weightKg,
  initialType = null,
  label = "+ Registrar",
  variant = "primary",
  size = "lg",
  className,
}: {
  today: string;
  weightKg: number;
  initialType?: WorkoutType | null;
  label?: string;
  variant?: "primary" | "secondary";
  size?: "lg" | "sm" | "default";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WorkoutType | null>(initialType);
  const [date, setDate] = useState(today);
  const [otherDay, setOtherDay] = useState(false);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [zones, setZones] = useState<Partial<Record<Zone, ZoneWork>>>({});
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const reset = () => {
    setType(initialType);
    setDate(today);
    setOtherDay(false);
    setMinutes(null);
    setZones({});
    setNote("");
    setMsg(null);
  };

  const toggleZone = (z: Zone) =>
    setZones((cur) => {
      const next = { ...cur };
      if (next[z]) delete next[z];
      else next[z] = { ...DEFAULT_ZONE };
      return next;
    });
  const setZone = (z: Zone, k: keyof ZoneWork, v: number) => setZones((cur) => ({ ...cur, [z]: { ...cur[z]!, [k]: v } }));

  const kcal = type === "correr" && minutes ? runKcal(minutes, weightKg) : null;

  const save = () =>
    start(async () => {
      if (!type) return;
      const res = await addWorkout({
        date,
        type,
        minutes,
        note,
        details: type === "fuerza" ? { zones } : type === "correr" && kcal ? { kcal } : {},
      });
      if (res.error) return setMsg(res.error);
      setMsg(CHEERS[type]);
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 900);
    });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-h-[92dvh] overflow-y-auto">
          {!type ? (
            <>
              <SheetTitle>¿Qué hiciste?</SheetTitle>
              <SheetDescription className="mb-5">Un toque y listo.</SheetDescription>
              <div className="grid grid-cols-2 gap-3">
                {TYPES.map((t) => (
                  <Button key={t} size="lg" className={cn("bg-bg", t === "fuerza" && "col-span-2")} onClick={() => setType(t)}>
                    {TYPE_EMOJI[t]} {TYPE_LABEL[t]}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div>
                <SheetTitle>
                  {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
                </SheetTitle>
                <SheetDescription>Cargá lo que quieras. Guardá y listo.</SheetDescription>
              </div>

              <div className="space-y-2">
                <Chips
                  value={otherDay ? "otro" : date}
                  onChange={(v) => {
                    if (v === "otro") return setOtherDay(true);
                    setOtherDay(false);
                    setDate(v);
                  }}
                  options={[
                    { value: today, label: "Hoy" },
                    { value: shiftDate(today, -1), label: "Ayer" },
                    { value: "otro", label: "Otro día" },
                  ]}
                />
                {otherDay && (
                  <input
                    type="date"
                    className={inputClass}
                    max={today}
                    min={shiftDate(today, -60)}
                    value={date}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted">Minutos</p>
                <Chips cols={3} value={minutes} onChange={setMinutes} options={MINUTES.map((m) => ({ value: m, label: `${m}` }))} />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Otro (min)"
                  className={inputClass}
                  value={minutes !== null && !MINUTES.includes(minutes) ? minutes : ""}
                  onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
                />
                {kcal !== null && <p className="text-sm font-bold">≈ {kcal} kcal quemadas</p>}
              </div>

              {type === "fuerza" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted">¿Qué entrenaste?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ZONES.map((z) => (
                      <button
                        key={z.key}
                        type="button"
                        onClick={() => toggleZone(z.key)}
                        className={cn(
                          "h-12 rounded-xl text-sm font-bold transition-colors",
                          zones[z.key] ? "bg-accent text-accent-fg" : "bg-bg text-fg",
                        )}
                      >
                        {z.emoji} {z.label}
                      </button>
                    ))}
                  </div>
                  {ZONES.filter((z) => zones[z.key]).map((z) => (
                    <div key={z.key} className="space-y-2 rounded-xl bg-bg p-3">
                      <p className="text-sm font-bold">
                        {z.emoji} {z.label}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <Stepper label="Ejercicios" value={zones[z.key]!.exercises} onChange={(v) => setZone(z.key, "exercises", v)} />
                        <Stepper label="Reps" value={zones[z.key]!.reps} onChange={(v) => setZone(z.key, "reps", v)} />
                        <Stepper label="Vueltas" value={zones[z.key]!.rounds} onChange={(v) => setZone(z.key, "rounds", v)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {type !== "correr" && (
                <input
                  type="text"
                  placeholder={type === "fuerza" ? "Nota (pesos, recordatorios…)" : "Nota"}
                  className={inputClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}

              <Button variant="primary" size="lg" className="w-full" disabled={pending} onClick={save}>
                {pending ? "Guardando…" : "Guardar"}
              </Button>
              {!initialType && (
                <Button variant="ghost" className="w-full text-muted" onClick={() => setType(null)}>
                  Cambiar tipo
                </Button>
              )}
              {msg && <p className="text-center text-sm font-bold">{msg}</p>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
