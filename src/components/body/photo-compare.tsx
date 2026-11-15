"use client";

import { useMemo, useState } from "react";
import { ANGLES, type Angle } from "@/lib/body";
import { shortDate } from "@/lib/week";
import { Chips } from "@/components/training/chips";

type Item = { id: string; date: string; photos: Partial<Record<Angle, string>> };

const selectClass = "h-11 w-full rounded-xl bg-bg px-3 text-sm font-bold text-fg outline-none";

/** Antes / ahora con slider: arrastrás y se descubre la foto nueva. */
export function PhotoCompare({ checks }: { checks: Item[] }) {
  const [angle, setAngle] = useState<Angle>("front");
  const withAngle = useMemo(() => checks.filter((c) => c.photos[angle]), [checks, angle]);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [pos, setPos] = useState(50);

  const before = withAngle.find((c) => c.id === beforeId) ?? withAngle[0];
  const after = withAngle.find((c) => c.id === afterId) ?? withAngle.at(-1);

  return (
    <div className="space-y-3">
      <Chips value={angle} onChange={setAngle} options={ANGLES.map((a) => ({ value: a.key, label: a.label }))} />
      {withAngle.length < 2 || !before || !after ? (
        <p className="text-sm text-muted">Con dos controles con foto de este ángulo aparece el antes/ahora.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <select className={selectClass} value={before.id} onChange={(e) => setBeforeId(e.target.value)} aria-label="Antes">
              {withAngle.map((c) => (
                <option key={c.id} value={c.id}>
                  Antes: {shortDate(c.date)}
                </option>
              ))}
            </select>
            <select className={selectClass} value={after.id} onChange={(e) => setAfterId(e.target.value)} aria-label="Ahora">
              {withAngle.map((c) => (
                <option key={c.id} value={c.id}>
                  Ahora: {shortDate(c.date)}
                </option>
              ))}
            </select>
          </div>
          <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-xl bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={before.photos[angle]} alt="Antes" className="absolute inset-0 size-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={after.photos[angle]}
              alt="Ahora"
              className="absolute inset-0 size-full object-cover"
              style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            />
            <div className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-accent" style={{ left: `${pos}%` }} />
            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold">Antes</span>
            <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold">Ahora</span>
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-label="Comparar"
              className="absolute inset-0 size-full cursor-ew-resize opacity-0"
            />
          </div>
        </>
      )}
    </div>
  );
}
