"use client";

import { useState, useTransition } from "react";
import { compensateEvent, deleteEvent } from "@/app/(tabs)/entrenos/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KIND_LABEL, compDetailText, compensateDeadline } from "@/lib/events";
import { TYPE_LABEL, type WorkoutType } from "@/lib/training-types";
import { shiftDate } from "@/lib/fast";
import type { EventView } from "@/lib/training-types";
import { dayName, shortDate } from "@/lib/week";

/** Tarjeta de un evento según su momento: preparar, disfrutar, compensar. */
export function EventCard({ ev, today }: { ev: EventView; firstMeal?: string; today: string }) {
  const [pending, start] = useTransition();
  const [party, setParty] = useState(false);

  const compensate = (undo = false) =>
    start(async () => {
      const res = await compensateEvent(ev.id, undo);
      if (!res.error && !undo) setParty(true);
    });

  const remove = () => start(async () => void (await deleteEvent(ev.id)));

  if (ev.phase === "compensate") {
    const deadline = compensateDeadline(ev.date);
    const yesterday = ev.date === shiftDate(today, -1);
    const task = compDetailText(ev.compensation, ev.comp_detail, (s) => TYPE_LABEL[s as WorkoutType] ?? s);
    const until = deadline === today ? "Hoy es el último día para compensarlo." : `Tenés hasta el ${dayName(deadline)} para compensarlo.`;
    return (
      <Card className="space-y-4">
        <div>
          <CardTitle>😈 Toca compensar · {ev.name}</CardTitle>
          <CardDescription className="mt-1">
            {yesterday ? "Ayer fue fiesta, hoy le devolvemos al cuerpo. " : `Fue el ${shortDate(ev.date)}. `}
            Toca: <strong className="text-fg">{task}</strong>. {until}
          </CardDescription>
          <p className="mt-2 text-xs text-muted">✨ Se marca solo cuando lo cargás. Si lo compensaste de otra forma, tocá el botón.</p>
        </div>
        <Button variant="primary" size="lg" className="w-full" disabled={pending} onClick={() => compensate()}>
          ✓ Listo, compensado
        </Button>
      </Card>
    );
  }

  if (ev.phase === "compensated") {
    return (
      <Card className={party ? "animate-in zoom-in-95 fade-in duration-500" : ""}>
        <CardTitle>✅ {ev.name}: derrape compensado</CardTitle>
        <CardDescription className="mt-1">
          {party ? "¡Bien ahí! Sumaste a la racha de compensados." : "Marca de compensado puesta."}
        </CardDescription>
        <button className="mt-3 text-xs text-muted underline" disabled={pending} onClick={() => compensate(true)}>
          Deshacer
        </button>
      </Card>
    );
  }

  const headline =
    ev.phase === "today"
      ? `Hoy: ${ev.name}. ¡Disfrutá!`
      : ev.phase === "tomorrow"
        ? `Mañana: ${ev.name}. Hoy metéle fierritos`
        : `${ev.name} · ${shortDate(ev.date)}`;

  return (
    <Card>
      <CardTitle>😈 {headline}</CardTitle>
      <CardDescription className="mt-1">
        {KIND_LABEL[ev.kind]} · Se compensa con {compDetailText(ev.compensation, ev.comp_detail, (x) => TYPE_LABEL[x as WorkoutType] ?? x)}
      </CardDescription>
      <button className="mt-3 text-xs text-muted underline" disabled={pending} onClick={remove}>
        Borrar derrape
      </button>
    </Card>
  );
}
