import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { fmt, type BodyCheck } from "@/lib/body";
import { ZONE_MEASURE, measureChange, type zoneStats } from "@/lib/progress";
import { ZONES } from "@/lib/training-types";

/** Qué zona entrenás más (últimas 12 semanas) y cómo se movió su medida. */
export function ZonesCard({ zones, checks }: { zones: ReturnType<typeof zoneStats>; checks: BodyCheck[] }) {
  const max = Math.max(1, ...zones.stats.map((s) => s.sessions));
  const top = ZONES.find((z) => z.key === zones.top);
  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>Fierritos por zona 💪🏻</CardTitle>
        <CardDescription>
          {top ? `Lo que más entrenás: ${top.emoji} ${top.label}.` : "Cuando registres fierritos con zona, acá ves en qué le metés más."}
        </CardDescription>
      </div>
      <ul className="space-y-3">
        {ZONES.map((z) => {
          const s = zones.stats.find((x) => x.zone === z.key)!;
          const m = ZONE_MEASURE[z.key];
          const change = measureChange(checks as (BodyCheck & Record<string, unknown>)[], m.key);
          return (
            <li key={z.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-bold">
                  {z.emoji} {z.label}
                </span>
                <span className="text-muted">
                  {s.sessions} {s.sessions === 1 ? "sesión" : "sesiones"} · {s.rounds} vueltas
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(s.sessions / max) * 100}%` }} />
              </div>
              <p className="text-xs text-muted">
                {change === null
                  ? `Medida de ${m.label}: con dos controles ves el cambio.`
                  : change === 0
                    ? `Medida de ${m.label}: igual que al principio.`
                    : `Medida de ${m.label}: ${change > 0 ? "+" : "−"}${fmt(Math.abs(change))} cm desde el primer control.`}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
