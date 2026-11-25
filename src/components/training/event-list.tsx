"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { compensateEvent, deleteEvent } from "@/app/(tabs)/entrenos/actions";
import { COMPENSATION_LABEL } from "@/lib/events";
import type { EventView } from "@/lib/training-types";
import { shortDate } from "@/lib/week";

const WHEN: Partial<Record<EventView["phase"], string>> = { upcoming: "agendado", tomorrow: "mañana", today: "hoy" };

/** Derrapes agendados en filas: fecha, compensación y un toque para marcarlo compensado. */
export function EventList({ events }: { events: EventView[] }) {
  const [pending, start] = useTransition();
  return (
    <ul className="divide-y divide-muted/30">
      {events.map((ev) => {
        const canCompensate = ev.phase === "compensate";
        return (
          <li key={ev.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{ev.name}</p>
              <p className="truncate text-xs text-muted">
                {shortDate(ev.date)} · {COMPENSATION_LABEL[ev.compensation]}
              </p>
            </div>
            {canCompensate ? (
              <button
                disabled={pending}
                onClick={() => start(async () => void (await compensateEvent(ev.id)))}
                className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-black text-accent-fg active:scale-95"
              >
                ✓ Compensé
              </button>
            ) : ev.phase === "missed" ? (
              <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-bold text-muted">sin compensar</span>
            ) : ev.phase === "compensated" ? (
              <button
                disabled={pending}
                onClick={() => start(async () => void (await compensateEvent(ev.id, true)))}
                className="shrink-0 text-xs font-bold text-muted"
                title="Deshacer"
              >
                ✅ Compensado
              </button>
            ) : (
              <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-bold text-muted">{WHEN[ev.phase]}</span>
            )}
            <button
              aria-label="Borrar derrape"
              disabled={pending}
              onClick={() => {
                if (confirm(`¿Borrar "${ev.name}"?`)) start(async () => void (await deleteEvent(ev.id)));
              }}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted active:bg-bg"
            >
              <X className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
