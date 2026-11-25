"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/app/(tabs)/entrenos/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DEFAULT_COMP, type CompPrefs, type EventKind } from "@/lib/events";
import { CompPicker } from "./comp-picker";
import { Chips } from "./chips";

const inputClass = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

export function EventSheet({
  today,
  className,
  fasting = true,
  defaults = DEFAULT_COMP,
}: {
  today: string;
  className?: string;
  fasting?: boolean;
  /** Cómo compensa por defecto (Ajustes). */
  defaults?: CompPrefs;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<EventKind>("cena");
  const [comp, setComp] = useState<CompPrefs>(defaults);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      const res = await createEvent({
        name,
        date,
        kind,
        compensation: fasting ? comp.mode : "workout",
        detail: { sport: comp.sport, minutes: comp.minutes, fastHours: comp.fastHours },
      });
      if (res.error) return setMsg(res.error);
      setMsg("¡Agendado! Derrapá tranqui, que después compensamos.");
      setTimeout(() => {
        setOpen(false);
        setName("");
        setMsg(null);
      }, 1100);
    });

  return (
    <>
      <Button
        size="lg"
        className={className}
        onClick={() => {
          setDate(today);
          setComp(defaults);
          setMsg(null);
          setOpen(true);
        }}
      >
        😈 Se viene un derrape
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-h-[90dvh] overflow-y-auto">
          <div className="space-y-5">
            <div>
              <SheetTitle>Derrape a la vista 😈</SheetTitle>
              <SheetDescription>Cero culpa: lo disfrutás y después lo compensamos.</SheetDescription>
              <p className="mt-2 rounded-xl bg-bg p-3 text-xs leading-snug text-muted">
                Anotar tus derrapes te sirve para ver cuándo te salís de tu rutina de comida o de ayuno. Suma a tus
                métricas personales, pero <strong className="text-fg">no cuenta para tu nivel ni para el ranking</strong>: es para
                tu motivación.
              </p>
            </div>
            <input
              className={inputClass}
              placeholder="¿Qué se viene? Ej: Cumple de Juli"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
            <input type="date" className={inputClass} min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="space-y-2">
              <p className="text-sm text-muted">¿Qué hay?</p>
              <Chips
                value={kind}
                onChange={setKind}
                options={[
                  { value: "cena", label: "Cena" },
                  { value: "tragos", label: "Tragos" },
                  { value: "ambos", label: "Ambos" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted">¿Cómo lo compensás? (tenés hasta el domingo; se marca solo cuando lo cargás)</p>
              <CompPicker value={comp} onChange={setComp} fasting={fasting} />
            </div>
            <Button variant="primary" size="lg" className="w-full" disabled={pending || !name.trim()} onClick={save}>
              {pending ? "Guardando…" : "Agendar"}
            </Button>
            {msg && <p className="text-center text-sm font-bold">{msg}</p>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
