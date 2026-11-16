import { LEVELS, type LevelKey } from "@/lib/level";
import { summaryText, type WeekSummary } from "@/lib/progress";
import { cn } from "@/lib/utils";

// Del gris al amarillo a medida que sube el nivel
const BADGE = ["bg-muted/40", "bg-muted/70", "bg-fg/25", "bg-accent/45", "bg-accent/75", "bg-accent"];

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;

/** "¿Cómo venís?": nivel de la semana pasada, escalera de niveles y cuántas veces fuiste cada perrita. */
export function LevelCard({
  last,
  counts,
  current,
}: {
  last: { weekStart: string; score: number; level: LevelKey } | null;
  counts: Record<LevelKey, number>;
  current: WeekSummary;
}) {
  const idx = last ? LEVELS.findIndex((l) => l.key === last.level) : -1;
  const lvl = idx >= 0 ? LEVELS[idx] : null;

  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-muted">¿Cómo venís?</p>

      {lvl ? (
        <div className="flex items-center gap-4">
          <div className={cn("relative grid size-24 shrink-0 place-items-center rounded-full", BADGE[idx])}>
            <span className="text-5xl">🐶</span>
            <span className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full bg-bg text-2xl ring-4 ring-surface">
              {lvl.emoji}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted">
              Nivel {idx + 1} de 6 · semana del {dm(last!.weekStart)}
            </p>
            <p className="text-2xl font-black leading-tight">{lvl.name}</p>
            <p className="mt-1 text-sm text-muted">{lvl.blurb}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-full bg-bg text-5xl">🐶</div>
          <div>
            <p className="text-xl font-black leading-tight">Tu primer nivel sale el lunes</p>
            <p className="mt-1 text-sm text-muted">Cada lunes califico la semana que cerró: ayunos, fierritos, movimiento y derrapes.</p>
          </div>
        </div>
      )}

      {/* Escalera de niveles con cuántas veces fuiste cada una */}
      <ol className="grid grid-cols-6 gap-1.5">
        {LEVELS.map((l, i) => (
          <li key={l.key} className="flex flex-col items-center gap-1">
            <span
              title={l.name}
              className={cn(
                "grid size-11 place-items-center rounded-full text-xl",
                i === idx ? "bg-accent ring-4 ring-accent/30" : i < idx ? "bg-fg/15" : "bg-bg opacity-60",
              )}
            >
              {l.emoji}
            </span>
            <span className={cn("text-[11px] font-bold tabular-nums", counts[l.key] ? "text-fg" : "text-muted")}>
              ×{counts[l.key]}
            </span>
          </li>
        ))}
      </ol>

      <p className="text-xs text-muted">
        Esta semana vas: {summaryText(current)}. Se recalcula el lunes.
      </p>
    </div>
  );
}
