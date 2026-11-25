"use client";

import { useState, useTransition } from "react";
import { setCoachPref, testCoach } from "@/app/(tabs)/admin/actions";
import { COACH_KINDS, type CoachKind } from "@/lib/phrases";
import { cn } from "@/lib/utils";

/** Avisos generales: prendidos/apagados para todas, con prueba en tu celu. */
export function CoachNotify({ prefs }: { prefs: Partial<Record<CoachKind, boolean>> }) {
  const [local, setLocal] = useState(prefs);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (kind: CoachKind) => {
    const on = local[kind] === false;
    setLocal((p) => ({ ...p, [kind]: on }));
    start(async () => {
      const res = await setCoachPref(kind, on);
      setMsg(res.error ?? res.ok ?? null);
      if (res.error) setLocal((p) => ({ ...p, [kind]: !on }));
    });
  };
  const test = (kind: CoachKind) =>
    start(async () => {
      const res = await testCoach(kind);
      setMsg(res.error ?? res.ok ?? null);
    });

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-muted/30">
        {COACH_KINDS.map(({ kind, label, when }) => {
          const on = local[kind] !== false;
          return (
            <li key={kind} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{label}</p>
                <p className="text-xs text-muted">{when}</p>
                <button type="button" disabled={pending} onClick={() => test(kind)} className="mt-1 text-xs font-bold underline">
                  Probar en mi celu
                </button>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                disabled={pending}
                onClick={() => toggle(kind)}
                className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-accent" : "bg-bg")}
              >
                <span className={cn("absolute top-1 size-5 rounded-full transition-all", on ? "left-6 bg-accent-fg" : "left-1 bg-muted")} />
              </button>
            </li>
          );
        })}
      </ul>
      {msg && <p className="text-sm font-bold">{msg}</p>}
    </div>
  );
}
