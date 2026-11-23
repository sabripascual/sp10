"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { FastDaySheet, type EditableFast } from "./fast-day-sheet";
import { formatInTimeZone } from "date-fns-tz";
import type { DayMark } from "@/lib/fast";
import { shortDate } from "@/lib/week";

const MARK: Partial<Record<DayMark, string>> = {
  ok: "✅",
  extended: "💪",
  event: "😈",
  broken: "✂️",
};

const hm = (iso: string, tz: string) =>
  formatInTimeZone(new Date(iso), tz, "HH:mm");
const fmtH = (h: number) => `${String(h).replace(".", ",")} h`;

/** Últimos ayunos con sus horas: reales si los marcaste, si no según tu horario. */
export function FastHistory({
  items,
  timezone,
}: {
  items: {
    date: string;
    startISO: string;
    endISO: string;
    hours: number;
    mark: DayMark;
    confirmed: boolean;
  }[];
  timezone: string;
}) {
  const [editing, setEditing] = useState<EditableFast | null>(null);
  if (items.length === 0)
    return (
      <p className="text-sm text-muted">
        Acá van a aparecer tus ayunos con sus horas.
      </p>
    );
  return (
    <>
      <ul className="divide-y divide-muted/30">
        {items.map((it) => (
          <li key={it.date}>
            <button
              type="button"
              onClick={() =>
                setEditing({
                  date: it.date,
                  startISO: it.startISO,
                  endISO:
                    it.hours > 0
                      ? it.endISO
                      : new Date(
                          new Date(it.startISO).getTime() + 16 * 3_600_000,
                        ).toISOString(),
                  mark: it.mark,
                })
              }
              className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-70"
            >
              <span className="text-lg">{MARK[it.mark] ?? "✅"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{shortDate(it.date)}</p>
                <p className="text-xs text-muted">
                  {hm(it.startISO, timezone)} → {hm(it.endISO, timezone)}
                  {!it.confirmed && " · según horario"}
                </p>
              </div>
              <span className="text-lg font-black tabular-nums">
                {fmtH(it.hours)}
              </span>
              <Pencil className="size-3.5 shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>
      <p className="pt-2 text-xs text-muted">Tocá uno para corregirlo.</p>
      <FastDaySheet
        fast={editing}
        timezone={timezone}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
