"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteCheck } from "@/app/(tabs)/cuerpo/actions";
import { ANGLES, type Angle } from "@/lib/body";
import { shortDate } from "@/lib/week";

type Item = { id: string; date: string; photos: Partial<Record<Angle, string>> };

export function CheckHistory({ checks }: { checks: Item[] }) {
  const [pending, start] = useTransition();
  return (
    <ul className="space-y-3">
      {[...checks].reverse().map((c) => (
        <li key={c.id} className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {ANGLES.map(({ key, label }) =>
              c.photos[key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={key} src={c.photos[key]} alt={label} className="h-14 w-11 rounded-lg object-cover" />
              ) : (
                <span key={key} className="h-14 w-11 rounded-lg bg-bg" />
              ),
            )}
          </div>
          <p className="flex-1 text-sm font-bold">{shortDate(c.date)}</p>
          <button
            aria-label="Borrar control"
            disabled={pending}
            onClick={() => {
              if (confirm("¿Borrar este control y sus fotos?")) start(async () => void (await deleteCheck(c.id)));
            }}
            className="grid size-9 place-items-center rounded-full text-muted active:bg-bg"
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
