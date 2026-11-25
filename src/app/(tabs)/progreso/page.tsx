import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { MeasuresChart, RunChart, WeightChart } from "@/components/progress/charts";
import { ZonesCard } from "@/components/progress/zones-card";
import { getProgressData } from "@/lib/progress-data";
import { summaryText, weekGoals } from "@/lib/progress";
import { profileGoals } from "@/lib/goals";
import { cn } from "@/lib/utils";
import { fastingOn } from "@/lib/profile";

function Stat({ value, label, sub, hot }: { value: number; label: string; sub: string; hot?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className={cn("text-4xl font-black tabular-nums", hot && "text-accent")}>{value}</p>
      <p className="mt-1 text-sm font-bold leading-tight">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;

export default async function ProgresoPage() {
  const { profile, weeks: allWeeks, fast, strength, compensated, checks, zones } = await getProgressData();
  const weeks = allWeeks.slice(-12);
  const current = weeks.at(-1)!;
  // Solo se muestra lo que es parte de TU rutina (Ajustes → Tu semana ideal)
  const goals = profileGoals(profile, current.weekStart);
  const has = (k: keyof typeof goals) => (goals[k] ?? 0) > 0;
  const showFast = fastingOn(profile) && has("ayuno");
  const showStrength = has("fuerza");
  const past = weeks
    .slice(0, -1)
    .reverse()
    .filter((w) => weekGoals(w).items.some((i) => i.done > 0));
  const stats = 1 + Number(showFast) + Number(showStrength);

  return (
    <>
      <PageHeader title="Progreso" subtitle="Constancia que se ve." />
      <div className="space-y-4">
        <div className={cn("grid gap-2", stats === 3 ? "grid-cols-3" : stats === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {showFast && (
            <Stat value={fast.current} label="días de ayuno" sub={`Récord: ${fast.max}`} hot={fast.current > 0 && fast.current === fast.max} />
          )}
          {showStrength && (
            <Stat value={strength.current} label={`semanas con ${goals.fuerza}/${goals.fuerza} fierritos`} sub={`Récord: ${strength.max}`} />
          )}
          <Stat value={compensated.current} label="compensados seguidos" sub={`Total: ${compensated.total}`} />
        </div>

        <Card className="space-y-1">
          <CardTitle>Esta semana</CardTitle>
          <CardDescription className="text-base text-fg">{summaryText(current)}</CardDescription>
        </Card>

        {showStrength && profile.strength_mode === "detailed" && <ZonesCard zones={zones} checks={checks} />}

        {has("correr") && (
          <Card className="space-y-3">
            <CardTitle>Minutos de carrera por semana</CardTitle>
            <RunChart weeks={weeks} />
          </Card>
        )}

        <Card className="space-y-3">
          <CardTitle>Medidas</CardTitle>
          <MeasuresChart checks={checks} />
        </Card>

        <Card className="space-y-3">
          <div>
            <CardTitle>Tendencia de peso</CardTitle>
            <CardDescription>
              Promedio de los últimos 3 controles{profile.hide_weight ? ", sin números (número oculto)." : "."}
            </CardDescription>
          </div>
          <WeightChart checks={checks} hidden={profile.hide_weight} />
        </Card>

        {past.length > 0 && (
          <Card className="space-y-3">
            <CardTitle>Semanas anteriores</CardTitle>
            <ul className="divide-y divide-muted/30">
              {past.map((w) => (
                <li key={w.weekStart} className="py-3">
                  <p className="text-xs font-bold text-muted">Semana del {dm(w.weekStart)}</p>
                  <p className="text-sm">{summaryText(w)}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
