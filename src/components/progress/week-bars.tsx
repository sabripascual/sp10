import { cn } from "@/lib/utils";

const dm = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;

/**
 * Barras semanales simples: lo hecho cada semana, con la meta marcada (raya).
 * Amarillo = cumplida; gris = no; la semana en curso, punteada.
 */
export function WeekBars({
  items,
  format = (n) => String(n),
  height = 72,
}: {
  items: { weekStart: string; value: number; target?: number; isCurrent?: boolean }[];
  format?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...items.map((i) => Math.max(i.value, i.target ?? 0)));
  return (
    <div className="flex items-end gap-1" style={{ height: height + 32 }}>
      {items.map((i) => {
        const met = i.target ? i.value >= i.target : i.value > 0;
        const h = (i.value / max) * height;
        return (
          <div key={i.weekStart} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-black tabular-nums text-muted">{i.value ? format(i.value) : ""}</span>
            <div className="relative flex w-full items-end" style={{ height }}>
              {i.target ? (
                <span className="absolute inset-x-0 border-t-2 border-dashed border-fg/40" style={{ bottom: (i.target / max) * height }} aria-hidden />
              ) : null}
              <span
                className={cn(
                  "block w-full rounded-t-md",
                  met ? "bg-accent" : "bg-muted/60",
                  i.isCurrent && "opacity-60 outline-1 outline-dashed outline-accent",
                )}
                style={{ height: Math.max(i.value ? 4 : 2, h) }}
              />
            </div>
            <span className={cn("text-[9px] tabular-nums", i.isCurrent ? "font-black text-fg" : "text-muted")}>{dm(i.weekStart)}</span>
          </div>
        );
      })}
    </div>
  );
}
