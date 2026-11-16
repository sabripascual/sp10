import { cn } from "@/lib/utils";
import { fmt } from "@/lib/body";

type Row = { key: string; label: string; now: number | null; prev: number | null; delta: number | null };

/** Medidas con su diferencia contra el control anterior. */
export function Deltas({ rows, compact = false }: { rows: Row[]; compact?: boolean }) {
  const shown = rows.filter((r) => r.now !== null);
  if (shown.length === 0) return <p className="text-sm text-muted">Sin medidas cargadas.</p>;
  if (compact) {
    return (
      <ul className="divide-y divide-muted/30">
        {shown.map((r) => (
          <li key={r.key} className="flex items-baseline justify-between py-2 text-sm">
            <span className="text-muted">{r.label}</span>
            <span className="flex items-baseline gap-3">
              <span className="font-black tabular-nums">{fmt(r.now!)} cm</span>
              <span className={cn("w-16 text-right text-xs font-bold", r.delta !== null && r.delta < 0 ? "text-accent" : "text-muted")}>
                {r.delta === null ? "—" : r.delta === 0 ? "=" : `${r.delta > 0 ? "+" : "−"}${fmt(Math.abs(r.delta))}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-2">
      {shown.map((r) => (
        <li key={r.key} className="rounded-xl bg-bg p-3">
          <p className="text-xs text-muted">{r.label}</p>
          <p className="text-xl font-black tabular-nums">{fmt(r.now!)} cm</p>
          <p className={cn("text-xs font-bold", r.delta !== null && r.delta < 0 ? "text-accent" : "text-muted")}>
            {r.delta === null ? "Primera marca" : r.delta === 0 ? "Igual que antes" : `${r.delta > 0 ? "+" : "−"}${fmt(Math.abs(r.delta))} cm`}
          </p>
        </li>
      ))}
    </ul>
  );
}
