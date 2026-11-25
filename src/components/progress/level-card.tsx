import {
  LEVELS,
  levelFor,
  weekScore,
  type LevelKey,
  type ScorePart,
} from "@/lib/level";
import { weekGoals, type WeekSummary } from "@/lib/progress";
import { fmtCount, missingText } from "@/lib/goals";
import Link from "next/link";
import { Avatar } from "@/components/shell/avatar";
import { cn } from "@/lib/utils";

// Del gris al amarillo a medida que sube el nivel
const BADGE = [
  "bg-muted/40",
  "bg-muted/70",
  "bg-fg/25",
  "bg-accent/45",
  "bg-accent/75",
  "bg-accent",
];


/** "¿Cómo venís?": nivel de la semana pasada, escalera de niveles y cuántas veces fuiste cada perrita. */
export function LevelCard({
  last,
  counts,
  current,
  avatar = null,
}: {
  avatar?: string | null;
  last: {
    weekStart: string;
    score: number;
    level: LevelKey;
    parts: ScorePart[];
  } | null;
  counts: Record<LevelKey, number>;
  current: WeekSummary;
}) {
  const idx = last ? LEVELS.findIndex((l) => l.key === last.level) : -1;
  const lvl = idx >= 0 ? LEVELS[idx] : null;

  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-muted">
        ¿Cómo venís?
      </p>

      {lvl ? (
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "relative grid size-24 shrink-0 place-items-center rounded-full",
              BADGE[idx],
              avatar && "p-1",
            )}
          >
            <Avatar url={avatar} className="size-full" emojiClass="text-5xl" />
            <span className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full bg-bg text-2xl ring-4 ring-surface">
              {lvl.emoji}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted">Tu clasificación de la semana</p>
            <p className="text-2xl font-black leading-tight">{lvl.name}</p>
            <p className="mt-1 text-sm text-muted">{lvl.blurb}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Avatar
            url={avatar}
            className="size-24 shrink-0 bg-bg"
            emojiClass="text-5xl"
          />
          <div>
            <p className="text-xl font-black leading-tight">
              Tu primer nivel sale el lunes
            </p>
            <p className="mt-1 text-sm text-muted">
              Califico semanas completas (lunes a domingo) según tu semana
              ideal.
            </p>
          </div>
        </div>
      )}

      {/* Escalera de niveles con cuántas semanas fuiste cada una */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted">
          ¿Cuántas semanas estuviste en cada nivel?
        </p>
        <ol className="grid grid-cols-6 gap-1.5">
          {LEVELS.map((l, i) => (
            <li key={l.key} className="flex flex-col items-center gap-1">
              <span
                title={l.name}
                className={cn(
                  "grid size-11 place-items-center rounded-full text-xl",
                  i === idx
                    ? "bg-accent ring-4 ring-accent/30"
                    : i < idx
                      ? "bg-fg/15"
                      : "bg-bg opacity-60",
                )}
              >
                {l.emoji}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold tabular-nums leading-none",
                  counts[l.key] ? "text-fg" : "text-muted",
                )}
              >
                {counts[l.key]}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <CurrentWeek current={current} />
    </div>
  );
}

/** Tu semana ideal: a qué % vas, cada objetivo y lo que falta. */
function CurrentWeek({ current }: { current: WeekSummary }) {
  const score = weekScore(current);
  const lvl = levelFor(score);
  const { items, pct } = weekGoals(current);
  const falta = missingText(items);
  return (
    <div className="space-y-3 rounded-xl bg-bg p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold">Tu progreso de la semana</p>
        <p className="text-3xl font-black tabular-nums leading-none">{pct}%</p>
      </div>
      <span className="block h-2 overflow-hidden rounded-full bg-surface">
        <span
          className="block h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((g) => (
          <li
            key={g.key}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
              g.done >= g.target
                ? "bg-accent text-accent-fg"
                : "bg-surface text-fg",
            )}
          >
            {g.emoji} {fmtCount(g.done)}/{g.target}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        {pct >= 100 ? (
          <span className="font-bold text-fg">¡Semana ideal cumplida! 👑</span>
        ) : (
          <>
            Te falta: <span className="font-bold text-fg">{falta}</span>.
          </>
        )}{" "}
        Llevás {score} pts {lvl.emoji}; el lunes sale tu nivel.{" "}
        <Link href="/ajustes" className="underline">
          Cambiar objetivos
        </Link>
      </p>
    </div>
  );
}
