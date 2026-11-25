import { cn } from "@/lib/utils";

const dm = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;

/**
 * Puntitos por semana: lleno = cumplido, mitad = cerca (50 % o más), vacío = lejos.
 * `ratio` = hecho / meta (null = esa semana no tenía ese objetivo).
 */
export function Dots({ weeks, size = "size-3" }: { weeks: { weekStart: string; ratio: number | null }[]; size?: string }) {
  return (
    <span className="flex items-center gap-1" aria-label="Últimas semanas">
      {weeks.map((w) => {
        const r = w.ratio;
        return (
          <span
            key={w.weekStart}
            title={`Semana del ${dm(w.weekStart)}${r === null ? "" : `: ${Math.round(r * 100)}%`}`}
            className={cn(
              "inline-block shrink-0 rounded-full",
              size,
              r === null ? "border border-dashed border-muted/60" : r >= 1 ? "bg-accent" : r >= 0.5 ? "" : "border-2 border-muted/70",
            )}
            style={r !== null && r >= 0.5 && r < 1 ? { background: "linear-gradient(90deg, #ffe900 50%, #555 50%)" } : undefined}
          />
        );
      })}
    </span>
  );
}
