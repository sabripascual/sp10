"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/app/(tabs)/entrenos/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Compensation, EventKind } from "@/lib/events";
import { Chips } from "./chips";

const inputClass = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

export function EventSheet({ today, className, fasting = true }: { today: string; className?: string; fasting?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<EventKind>("cena");
  const [comp, setComp] = useState<Compensation>(fasting ? "fast" : "workout");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      const res = await createEvent({ name, date, kind, compensation: comp });
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
              <SheetDescription>Cero culpa: lo disfrutás y al otro día lo compensamos.</SheetDescription>
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
              <p className="text-sm text-muted">¿Cómo lo compensamos al día siguiente?</p>
              <Chips
                cols={1}
                value={comp}
                onChange={setComp}
                options={
                  fasting
                    ? [
                        { value: "fast", label: "+2 h de ayuno" },
                        { value: "workout", label: "Entreno extra (fierritos o 30 min de carrera)" },
                        { value: "both", label: "Las dos" },
                      ]
                    : [{ value: "workout", label: "Entreno extra (fierritos o 30 min de carrera)" }]
                }
              />
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
