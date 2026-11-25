import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { MeasuresChart, WeightChart } from "@/components/progress/charts";
import { ZonesCard } from "@/components/progress/zones-card";
import { WeekBars } from "@/components/progress/week-bars";
import { getProgressData } from "@/lib/progress-data";
import {
  goalSeries,
  idealStats,
  otherWorkouts,
  weekGoals,
} from "@/lib/progress";
import {
  GOAL_KEYS,
  GOAL_LABEL,
  fmtCount,
  profileGoals,
  type GoalKey,
} from "@/lib/goals";
import { levelFor, weekScore } from "@/lib/level";
import { TYPE_LABEL, type WorkoutType } from "@/lib/training-types";
import { fastingOn } from "@/lib/profile";
import { cn } from "@/lib/utils";

const dm = (date: string) =>
  `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;
const comma = (n: number) => String(n).replace(".", ",");

function Big({
  value,
  label,
  sub,
  hot,
}: {
  value: string | number;
  label: string;
  sub?: string;
  hot?: boolean;
}) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <p
        className={cn(
          "text-3xl font-black tabular-nums leading-none",
          hot && "text-accent",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs font-bold leading-tight">{label}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

export default async function ProgresoPage() {
  const data = await getProgressData();
  const { profile, fast, compensated, checks, zones, fastAvgHours } = data;
  const weeks = data.weeks.slice(-12);
  const current = weeks.at(-1)!;

  // Tu semana ideal de hoy define qué se muestra (en su orden); cada semana se mide con los objetivos que tenía
  const goals = profileGoals(profile, current.weekStart);
  const keys = GOAL_KEYS.filter(
    (k) => (goals[k] ?? 0) > 0 && (k !== "ayuno" || fastingOn(profile)),
  );
  const ideal = idealStats(weeks);
  const others = otherWorkouts(weeks, keys);
  const missed12 = weeks.reduce((a, w) => a + w.missed, 0);
  const past = weeks
    .slice(0, -1)
    .reverse()
    .filter((w) => weekGoals(w).items.some((i) => i.done > 0));

  return (
    <>
      <PageHeader
        title="Progreso"
        subtitle="Tu constancia, según tu semana ideal."
      />
      <div className="space-y-4">
        {/* 1. Constancia general */}
        <Card className="space-y-4">
          <div>
            <CardTitle>Tu semana ideal, semana a semana</CardTitle>
            <CardDescription>
              % cumplido de tus objetivos (la raya es el 100 %).
            </CardDescription>
          </div>
          <WeekBars
            items={ideal.series.map((s) => ({
              weekStart: s.weekStart,
              value: s.pct,
              target: s.hasGoals ? 100 : undefined,
              isCurrent: s.isCurrent,
            }))}
            format={(n) => `${n}%`}
          />
          <div className="grid grid-cols-3 gap-2">
            <Big
              value={ideal.streak.current}
              label="semanas seguidas al 100 %"
              sub={`Récord: ${ideal.streak.max}`}
              hot={ideal.streak.current > 0}
            />
            <Big
              value={ideal.avg4 === null ? "—" : `${ideal.avg4}%`}
              label="promedio últimas 4"
            />
            <Big
              value={ideal.best === null ? "—" : `${ideal.best}%`}
              label="tu mejor semana"
            />
          </div>
        </Card>

        {/* 2. Una tarjeta por objetivo */}
        {keys.length === 0 && (
          <Card>
            <CardTitle>Armá tu semana ideal</CardTitle>
            <CardDescription className="mt-1">
              Elegí qué querés cumplir cada semana y acá ves tu progreso en cada
              cosa.{" "}
              <Link href="/ajustes" className="underline">
                Ir a Ajustes
              </Link>
            </CardDescription>
          </Card>
        )}
        {keys.map((k) => (
          <GoalCard
            key={k}
            k={k}
            data={data}
            weeks={weeks}
            fastAvgHours={fastAvgHours}
            fast={fast}
            zones={zones}
            checks={checks}
          />
        ))}

        {/* 3. Otros entrenos */}
        {others.length > 0 && (
          <p className="rounded-2xl bg-surface px-5 py-4 text-sm">
            <span className="font-bold">También hiciste</span>{" "}
            <span className="text-muted">(últimas 4 semanas):</span>{" "}
            {others
              .map(
                ([t, n]) =>
                  `${n} de ${(TYPE_LABEL[t as WorkoutType] ?? t).toLowerCase()}`,
              )
              .join(", ")}
          </p>
        )}

        {/* 4. Derrapes */}
        <Card className="space-y-3">
          <div>
            <CardTitle>Derrapes 😈</CardTitle>
            <CardDescription>
              Para vos: no cuentan para tu nivel ni para el ranking.
            </CardDescription>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Big
              value={compensated.current}
              label="compensados seguidos"
              hot={compensated.current > 0}
            />
            <Big value={compensated.total} label="compensados en total" />
            <Big value={missed12} label="sin compensar (12 sem)" />
          </div>
        </Card>

        {/* 5. Cuerpo */}
        <Card className="space-y-3">
          <CardTitle>Medidas</CardTitle>
          <MeasuresChart checks={checks} />
        </Card>
        <Card className="space-y-3">
          <div>
            <CardTitle>Tendencia de peso</CardTitle>
            <CardDescription>
              Promedio de los últimos 3 controles
              {profile.hide_weight ? ", sin números (número oculto)." : "."}
            </CardDescription>
          </div>
          <WeightChart checks={checks} hidden={profile.hide_weight} />
        </Card>

        {/* 6. Semanas anteriores */}
        {past.length > 0 && (
          <Card className="space-y-3">
            <CardTitle>Semanas anteriores</CardTitle>
            <ul className="divide-y divide-muted/30">
              {past.map((w) => {
                const g = weekGoals(w);
                const lvl = levelFor(weekScore(w));
                return (
                  <li key={w.weekStart} className="space-y-1.5 py-3">
                    <p className="flex items-center justify-between text-sm">
                      <span className="font-bold">
                        Semana del {dm(w.weekStart)}
                      </span>
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
                            i.done >= i.target
                              ? "bg-accent text-accent-fg"
                              : "bg-bg text-fg",
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
          </Card>
        )}
      </div>
    </>
  );
}

type Data = Awaited<ReturnType<typeof getProgressData>>;

/** Tarjeta de un objetivo: hecho vs. meta en 12 semanas, racha y lo propio del tipo. */
function GoalCard({
  k,
  weeks,
  fastAvgHours,
  fast,
  zones,
  checks,
  data,
}: {
  k: GoalKey;
  weeks: Data["weeks"];
  fastAvgHours: number | null;
  fast: Data["fast"];
  zones: Data["zones"];
  checks: Data["checks"];
  data: Data;
}) {
  const { series, streak } = goalSeries(weeks, k);
  const label = GOAL_LABEL[k];
  const thisWeek = series.at(-1)!;
  const closed = series.filter((s) => !s.isCurrent);
  const last4 = closed.slice(-4);
  const minutes4 = last4.reduce((a, s) => a + s.minutes, 0);
  const sessions4 = last4.reduce((a, s) => a + s.sessions, 0);
  const kcal4 = weeks.slice(-5, -1).reduce((a, w) => a + w.runKcal, 0);

  return (
    <>
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>
              {label.emoji} {label.label}
            </CardTitle>
            <CardDescription>
              Esta semana: {fmtCount(thisWeek.done)} de {thisWeek.target}
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-full bg-bg px-3 py-1 text-xs font-black">
            🔥 {streak.current} {streak.current === 1 ? "semana" : "semanas"}
          </span>
        </div>
        <WeekBars
          items={series.map((s) => ({
            weekStart: s.weekStart,
            value: s.done,
            target: s.target || undefined,
            isCurrent: s.isCurrent,
          }))}
          format={fmtCount}
        />
        <div className="grid grid-cols-3 gap-2">
          <Big value={streak.max} label="récord de semanas cumplidas" />
          {k === "ayuno" ? (
            <>
              <Big
                value={fast.current}
                label="días seguidos de ayuno"
                sub={`Récord: ${fast.max}`}
                hot={fast.current > 0 && fast.current === fast.max}
              />
              <Big
                value={fastAvgHours === null ? "—" : `${comma(fastAvgHours)} h`}
                label="duración promedio"
                sub="últimas 4 semanas"
              />
            </>
          ) : k === "correr" ? (
            <>
              <Big
                value={minutes4}
                label="min corridos"
                sub="últimas 4 semanas"
              />
              <Big
                value={kcal4 ? `≈${kcal4}` : "—"}
                label="kcal aprox."
                sub="últimas 4 semanas"
              />
            </>
          ) : (
            <>
              <Big value={sessions4} label="veces" sub="últimas 4 semanas" />
              <Big
                value={minutes4 || "—"}
                label="minutos"
                sub="últimas 4 semanas"
              />
            </>
          )}
        </div>
      </Card>
      {k === "fuerza" && data.profile.strength_mode === "detailed" && (
        <ZonesCard zones={zones} checks={checks} />
      )}
    </>
  );
}
