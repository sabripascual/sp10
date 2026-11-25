import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { MeasuresChart, WeightChart } from "@/components/progress/charts";
import { ZonesCard } from "@/components/progress/zones-card";
import { Dots } from "@/components/progress/dots";
import type { getProgressData } from "@/lib/progress-data";
import { goalSeries, idealStats, otherWorkouts, weekGoals } from "@/lib/progress";
import { GOAL_KEYS, GOAL_LABEL, fmtCount, profileGoals, type GoalKey } from "@/lib/goals";
import { levelFor, weekScore } from "@/lib/level";
import { TYPE_LABEL, type WorkoutType } from "@/lib/training-types";
import { fastingOn } from "@/lib/profile";
import { cn } from "@/lib/utils";

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;
const comma = (n: number) => String(n).replace(".", ",");
const DOT_WEEKS = 8;

type Data = Awaited<ReturnType<typeof getProgressData>>;

/** La pantalla con los datos ya cargados (separada para poder probarla). */
export function ProgresoView({ data }: { data: Data }) {
  const { profile, compensated, checks } = data;
  const weeks = data.weeks.slice(-(DOT_WEEKS + 1)); // 8 cerradas + la en curso
  const current = weeks.at(-1)!;

  // Tu semana ideal de hoy define qué se muestra (en su orden); cada semana se mide con los objetivos que tenía
  const goals = profileGoals(profile, current.weekStart);
  const keys = GOAL_KEYS.filter((k) => (goals[k] ?? 0) > 0 && (k !== "ayuno" || fastingOn(profile)));
  const ideal = idealStats(data.weeks.slice(-12));
  const now = weekGoals(current);
  const others = otherWorkouts(weeks, keys);
  const closed = ideal.series.filter((s) => !s.isCurrent).slice(-DOT_WEEKS);
  const past = data.weeks
    .slice(-13, -1)
    .reverse()
    .filter((w) => weekGoals(w).items.some((i) => i.done > 0));

  return (
    <>
      <PageHeader title="Progreso" subtitle="Tu constancia, según tu semana ideal." />
      <div className="space-y-4">
        {/* Constancia general */}
        <Card className="space-y-3">
          <p className="text-sm font-bold text-muted">Esta semana vas</p>
          <p className="text-6xl font-black tabular-nums leading-none">{now.pct}%</p>
          <p className="text-sm text-muted">
            {ideal.avg4 !== null && <>Promedio últimas 4: <strong className="text-fg">{ideal.avg4}%</strong> · </>}
            <strong className="text-fg">{ideal.streak.current}</strong> {ideal.streak.current === 1 ? "semana seguida" : "semanas seguidas"} al 100 %
          </p>
          {closed.length > 0 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <Dots weeks={closed.map((s) => ({ weekStart: s.weekStart, ratio: s.hasGoals ? s.pct / 100 : null }))} size="size-4" />
              <span className="text-[11px] text-muted">últimas {closed.length} semanas</span>
            </div>
          )}
        </Card>

        {/* Objetivos: lista compacta, el detalle se abre al tocar */}
        {keys.length === 0 ? (
          <Card>
            <CardTitle>Armá tu semana ideal</CardTitle>
            <CardDescription className="mt-1">
              Elegí qué querés cumplir cada semana y acá ves cómo venís en cada cosa.{" "}
              <Link href="/ajustes" className="underline">
                Ir a Ajustes
              </Link>
            </CardDescription>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface">
            <p className="px-5 pt-4 text-sm font-bold uppercase tracking-wide text-muted">Tus objetivos</p>
            <ul className="divide-y divide-muted/30">
              {keys.map((k) => (
                <GoalRow key={k} k={k} data={data} weeks={weeks} />
              ))}
            </ul>
            {others.length > 0 && (
              <p className="border-t border-muted/30 px-5 py-3 text-xs text-muted">
                También hiciste (últimas 4 semanas):{" "}
                {others.map(([t, n]) => `${n} de ${(TYPE_LABEL[t as WorkoutType] ?? t).toLowerCase()}`).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Derrapes: una línea */}
        {(compensated.total > 0 || compensated.current > 0) && (
          <p className="rounded-2xl bg-surface px-5 py-4 text-sm">
            😈 <strong>{compensated.total}</strong> {compensated.total === 1 ? "derrape compensado" : "derrapes compensados"} ·{" "}
            <strong>{compensated.current}</strong> seguidos <span className="text-muted">· no cuentan para tu nivel</span>
          </p>
        )}

        {/* Cuerpo */}
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

        {/* Semanas anteriores, cerradas */}
        {past.length > 0 && (
          <details className="group rounded-2xl bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-bold">
              Ver semanas anteriores
              <ChevronDown className="size-5 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <ul className="divide-y divide-muted/30 px-5 pb-2">
              {past.map((w) => {
                const g = weekGoals(w);
                const lvl = levelFor(weekScore(w));
                return (
                  <li key={w.weekStart} className="space-y-1.5 py-3">
                    <p className="flex items-center justify-between text-sm">
                      <span className="font-bold">Semana del {dm(w.weekStart)}</span>
                      <span className="font-black">
                        {g.pct}% {lvl.emoji}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {g.items.map((i) => (
                        <span
                          key={i.key}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                            i.done >= i.target ? "bg-accent text-accent-fg" : "bg-bg text-fg",
                          )}
                        >
                          {i.emoji} {fmtCount(i.done)}/{i.target}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </div>
    </>
  );
}

function Mini({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <p className="text-lg font-black tabular-nums leading-tight">{value}</p>
      <p className="text-[11px] leading-tight text-muted">{label}</p>
    </div>
  );
}

/** Una fila por objetivo: esta semana, racha y puntitos; al tocarla, el detalle. */
function GoalRow({ k, data, weeks }: { k: GoalKey; data: Data; weeks: Data["weeks"] }) {
  const { series, streak } = goalSeries(weeks, k);
  const label = GOAL_LABEL[k];
  const thisWeek = series.at(-1)!;
  const closed = series.filter((s) => !s.isCurrent);
  const last4 = closed.slice(-4);
  const minutes4 = last4.reduce((a, s) => a + s.minutes, 0);
  const sessions4 = last4.reduce((a, s) => a + s.sessions, 0);
  const kcal4 = weeks.slice(-5, -1).reduce((a, w) => a + w.runKcal, 0);
  const done = thisWeek.target > 0 && thisWeek.done >= thisWeek.target;

  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3">
          <span className="w-7 text-center text-xl">{label.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{label.label}</span>
            <span className="mt-1 block">
              <Dots weeks={closed.map((s) => ({ weekStart: s.weekStart, ratio: s.target ? s.done / s.target : null }))} size="size-2.5" />
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className={cn("block text-lg font-black tabular-nums leading-tight", done && "text-accent")}>
              {fmtCount(thisWeek.done)}/{thisWeek.target}
            </span>
            <span className="block text-[11px] text-muted">{streak.current > 0 ? `🔥 ${streak.current} sem` : "esta semana"}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-2 px-5 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <Mini value={streak.max} label="récord de semanas" />
            {k === "ayuno" ? (
              <>
                <Mini value={data.fast.current} label={`días seguidos (récord ${data.fast.max})`} />
                <Mini value={data.fastAvgHours === null ? "—" : `${comma(data.fastAvgHours)} h`} label="duración promedio" />
              </>
            ) : k === "correr" ? (
              <>
                <Mini value={minutes4} label="min en 4 semanas" />
                <Mini value={kcal4 ? `≈${kcal4}` : "—"} label="kcal en 4 semanas" />
              </>
            ) : (
              <>
                <Mini value={sessions4} label="veces en 4 semanas" />
                <Mini value={minutes4 || "—"} label="min en 4 semanas" />
              </>
            )}
          </div>
          {k === "fuerza" && data.profile.strength_mode === "detailed" && <ZonesCard zones={data.zones} checks={data.checks} />}
        </div>
      </details>
    </li>
  );
}
