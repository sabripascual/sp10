import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { MeasuresChart, WeightChart } from "@/components/progress/charts";
import type { getProgressData } from "@/lib/progress-data";
import { goalSeries, weekGoals } from "@/lib/progress";
import { GOAL_KEYS, GOAL_LABEL, missingText, profileGoals } from "@/lib/goals";
import { levelFor, weekScore } from "@/lib/level";
import { fastingOn } from "@/lib/profile";

type Data = Awaited<ReturnType<typeof getProgressData>>;

/** "16/11/2026" */
const dmy = (date: string) => `${date.slice(8)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
/** Número de semana desde tu primera semana en Ringo (la primera es la 1). */
const weekNumber = (ws: string, first: string) => Math.round((Date.parse(`${ws}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / (7 * 86_400_000)) + 1;
const LAST_WEEKS = 6;

/** Progreso simple: cómo voy esta semana, si estoy mejorando y qué me sale bien / qué me cuesta. */
export function ProgresoView({ data }: { data: Data }) {
  const { profile, checks } = data;
  const current = data.weeks.at(-1)!;
  const now = weekGoals(current);
  const falta = missingText(now.items);

  // ¿Estoy mejorando? Últimas semanas cerradas que tenían objetivos
  const closed = data.weeks.filter((w) => !w.isCurrent && weekGoals(w).items.length > 0);
  const recent = closed.slice(-LAST_WEEKS).reverse();
  const trend = trendText(closed.slice(-3).map((w) => weekGoals(w).pct));

  // ¿Qué me sale bien y qué me cuesta? Objetivos de hoy, mirando las últimas 4 semanas cerradas
  const goals = profileGoals(profile, current.weekStart);
  const keys = GOAL_KEYS.filter((k) => (goals[k] ?? 0) > 0 && (k !== "ayuno" || fastingOn(profile)));
  const last4 = data.weeks.slice(-5, -1);
  const scores = keys
    .map((k) => {
      const s = goalSeries(last4, k).series.filter((x) => x.target > 0);
      return { k, met: s.filter((x) => x.done >= x.target).length, of: s.length, target: goals[k] ?? 0 };
    })
    .filter((x) => x.of > 0)
    .sort((a, b) => b.met / b.of - a.met / a.of);
  const best = scores[0] && scores[0].met > 0 ? scores[0] : null;
  const worst = scores.length > 1 && scores.at(-1)!.met / scores.at(-1)!.of < (best ? best.met / best.of : 1) ? scores.at(-1)! : null;

  return (
    <>
      <PageHeader title="Progreso" subtitle="Tu constancia, según tu semana ideal." />
      <div className="space-y-4">
        {/* 1. ¿Cómo voy esta semana? */}
        <Card className="space-y-3">
          <p className="text-sm font-bold text-muted">Tu progreso de esta semana</p>
          <p className="text-6xl font-black tabular-nums leading-none">{now.pct}%</p>
          <span className="block h-3 overflow-hidden rounded-full bg-bg">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${now.pct}%` }} />
          </span>
          {now.items.length === 0 ? (
            <p className="text-sm text-muted">
              Armá tu semana ideal para ver tu progreso.{" "}
              <Link href="/ajustes" className="underline">
                Ir a Ajustes
              </Link>
            </p>
          ) : falta ? (
            <p className="text-sm text-muted">
              Te falta: <strong className="text-fg">{falta}</strong>
            </p>
          ) : (
            <p className="text-sm font-bold">¡Semana ideal cumplida! 👑</p>
          )}
        </Card>

        {/* 2. ¿Estoy mejorando? */}
        {recent.length > 0 && (
          <Card className="space-y-3">
            <div>
              <CardTitle>Tus últimas semanas</CardTitle>
              {trend && <CardDescription className="mt-0.5 text-fg">{trend}</CardDescription>}
            </div>
            <ul className="space-y-2.5">
              {recent.map((w) => {
                const pct = weekGoals(w).pct;
                const lvl = levelFor(weekScore(w));
                return (
                  <li key={w.weekStart} className="flex items-center gap-3 text-sm">
                    <span className="w-[74px] shrink-0 leading-tight">
                      <span className="block font-bold">Semana {weekNumber(w.weekStart, data.firstWeek)}</span>
                      <span className="block text-[10px] tabular-nums text-muted">{dmy(w.weekStart)}</span>
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-16 shrink-0 text-right font-black tabular-nums">
                      {pct}% {lvl.emoji}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {/* 3. ¿Qué me sale bien y qué me cuesta? */}
        {(best || worst) && (
          <div className="grid gap-3">
            {best && (
              <div className="rounded-2xl bg-surface p-5">
                <p className="text-sm font-bold text-muted">💪 Lo que mejor te sale</p>
                <p className="mt-1 text-lg font-black">
                  {GOAL_LABEL[best.k].emoji} {GOAL_LABEL[best.k].label}
                </p>
                <p className="text-sm text-muted">
                  Cumpliste {best.met} de {best.of} {best.of === 1 ? "semana" : "semanas"}. ¡Seguí así!
                </p>
              </div>
            )}
            {worst && (
              <div className="rounded-2xl bg-surface p-5">
                <p className="text-sm font-bold text-muted">🧗 Lo que más te cuesta</p>
                <p className="mt-1 text-lg font-black">
                  {GOAL_LABEL[worst.k].emoji} {GOAL_LABEL[worst.k].label}
                </p>
                <p className="text-sm text-muted">
                  Cumpliste {worst.met} de {worst.of} {worst.of === 1 ? "semana" : "semanas"}.
                  {worst.met === 0 && worst.target > 1 ? (
                    <>
                      {" "}
                      ¿Probás bajar la meta a {worst.target - 1}?{" "}
                      <Link href="/ajustes" className="underline">
                        Cambiarla
                      </Link>
                    </>
                  ) : (
                    " Un empujoncito más y lo tenés."
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. Cuerpo */}
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
      </div>
    </>
  );
}

/** "Venís subiendo: +30 % en las últimas 3 semanas 📈" (de la más vieja a la última). */
export function trendText(pcts: number[]) {
  if (pcts.length < 2) return null;
  const diff = pcts.at(-1)! - pcts[0];
  const span = pcts.length;
  if (diff >= 10) return `Venís subiendo: +${diff} % en las últimas ${span} semanas 📈`;
  if (diff <= -10) return "Bajaste un poco, nada que no se recupere 💪";
  return "Venís pareja, semana a semana 👌";
}
