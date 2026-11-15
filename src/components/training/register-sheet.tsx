"use client";

import { useState, useTransition } from "react";
import { addWorkout } from "@/app/(tabs)/entrenos/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { shiftDate } from "@/lib/fast";
import { TYPE_EMOJI, TYPE_LABEL, type Feeling, type WorkoutType } from "@/lib/training-types";
import { Chips } from "./chips";

const MINUTES: Record<WorkoutType, number[]> = {
  correr: [20, 30, 40, 50],
  fuerza: [45, 60, 75, 90],
  futbol: [50, 60, 90, 120],
  padel: [60, 90, 120, 150],
  otro: [30, 45, 60, 90],
};

const CHEERS: Record<WorkoutType, string> = {
  fuerza: "¡Fierro! Sumaste fuerza.",
  correr: "¡Trote anotado! Sos otra.",
  futbol: "¡Fútbol anotado! Ni el Dibu.",
  padel: "¡Pádel anotado!",
  otro: "¡Anotado!",
};

const inputClass = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

export function RegisterSheet({
  today,
  initialType = null,
  label,
  variant = "primary",
  size = "lg",
  className,
}: {
  today: string;
  initialType?: WorkoutType | null;
  label: string;
  variant?: "primary" | "secondary";
  size?: "lg" | "sm" | "default";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WorkoutType | null>(initialType);
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const reset = () => {
    setType(initialType);
    setDate(today);
    setMinutes(null);
    setFeeling(null);
    setNote("");
    setMsg(null);
  };

  const save = () =>
    start(async () => {
      if (!type) return;
      const res = await addWorkout({ date, type, minutes, feeling, note });
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
        <SheetContent className="max-h-[90dvh] overflow-y-auto">
          {!type ? (
            <>
              <SheetTitle>¿Qué hiciste?</SheetTitle>
              <SheetDescription className="mb-5">Un toque y listo.</SheetDescription>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(TYPE_LABEL) as WorkoutType[]).map((t) => (
                  <Button key={t} size="lg" className="bg-bg" onClick={() => setType(t)}>
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
                <SheetDescription>Todo opcional. Guardá y listo.</SheetDescription>
              </div>

              <Chips
                cols={2}
                value={date}
                onChange={setDate}
                options={[
                  { value: today, label: "Hoy" },
                  { value: shiftDate(today, -1), label: "Ayer" },
                ]}
              />

              <div className="space-y-2">
                <p className="text-sm text-muted">Minutos</p>
                <Chips
                  cols={4}
                  value={minutes}
                  onChange={setMinutes}
                  options={MINUTES[type].map((m) => ({ value: m, label: `${m}` }))}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Otro (min)"
                  className={inputClass}
                  value={minutes !== null && !MINUTES[type].includes(minutes) ? minutes : ""}
                  onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
                />
              </div>

              {type === "correr" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted">¿Cómo te sentiste?</p>
                  <Chips
                    value={feeling}
                    onChange={setFeeling}
                    options={[
                      { value: "dificil", label: "Difícil" },
                      { value: "bien", label: "Bien" },
                      { value: "excelente", label: "Excelente" },
                    ]}
                  />
                </div>
              )}

              {type !== "correr" && (
                <input
                  type="text"
                  placeholder={type === "fuerza" ? "Nota (ej: piernas, subí peso)" : "Nota"}
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
