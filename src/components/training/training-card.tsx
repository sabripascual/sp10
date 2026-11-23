import { Plus } from "lucide-react";
import { TYPE_EMOJI, TYPE_LABEL, favoritesOf, type DayPlan, type WorkoutType } from "@/lib/training-types";
import { RegisterSheet } from "./register-sheet";
import { WeekStrip } from "./week-strip";

const tile = "relative space-y-1 rounded-xl bg-bg p-3 text-left transition-transform active:scale-[0.97]";

function TileHead({ type }: { type: WorkoutType }) {
  return (
    <>
      <span className="block text-sm font-bold">
        {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
      </span>
      <span className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-accent text-accent-fg">
        <Plus className="size-3.5" strokeWidth={3} />
      </span>
    </>
  );
}

/**
 * Entrenamientos de la semana. Cada bloque (Fierritos, Carrera, Fútbol, Pádel)
 * se toca para sumar uno de ese tipo; "+ Registrar" (en Entrenos) abre todos los tipos.
 */
export function TrainingCard({
  week,
  strengthDone,
  goal,
  runMinutes,
  runKcal,
  today,
  weightKg,
  nicknames,
  favorites,
  showRegisterAll = false,
}: {
  week: DayPlan[];
  strengthDone: number;
  goal: number;
  runMinutes: number;
  runKcal: number;
  today: string;
  weightKg: number;
  nicknames: string[];
  /** Deportes frecuentes del perfil: los bloques que se muestran (hasta 4). */
  favorites?: string[] | null;
  showRegisterAll?: boolean;
}) {
  const all = week.flatMap((d) => d.workouts);
  const left = Math.max(goal - strengthDone, 0);
  const count = (t: WorkoutType) => all.filter((w) => w.type === t).length;
  const mins = (t: WorkoutType) => all.filter((w) => w.type === t).reduce((a, w) => a + (w.minutes ?? 0), 0);
  const sheet = { today, weightKg, nicknames, className: tile };
  const times = (n: number) => (n === 0 ? "Todavía nada" : n === 1 ? "1 vez" : `${n} veces`);

  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-muted">Entrenamientos · esta semana</p>

      <div className="grid grid-cols-2 gap-2">
        {favoritesOf(favorites).map((t) =>
          t === "fuerza" ? (
            <RegisterSheet key={t} {...sheet} initialType="fuerza">
              <TileHead type="fuerza" />
              <span className="block text-3xl font-black tabular-nums">
                {strengthDone}
                <span className="text-lg text-muted">/{goal}</span>
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-surface">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(strengthDone / goal, 1) * 100}%` }} />
              </span>
              <span className="block text-xs text-muted">{left === 0 ? "¡Meta cumplida!" : `Te ${left === 1 ? "falta 1" : `faltan ${left}`}`}</span>
            </RegisterSheet>
          ) : t === "correr" ? (
            <RegisterSheet key={t} {...sheet} initialType="correr">
              <TileHead type="correr" />
              <span className="block text-3xl font-black tabular-nums">
                {runMinutes}
                <span className="text-lg text-muted"> min</span>
              </span>
              <span className="block text-xs text-muted">
                {runMinutes > 0 ? `${runKcal ? `≈ ${runKcal} kcal` : ""}${count("correr") > 1 ? ` · ${count("correr")} salidas` : ""}` : "Sin carreras todavía"}
              </span>
            </RegisterSheet>
          ) : (
            <RegisterSheet key={t} {...sheet} initialType={t}>
              <TileHead type={t} />
              <span className="block text-3xl font-black tabular-nums">
                {count(t)}
                <span className="text-lg text-muted"> {count(t) === 1 ? "vez" : "veces"}</span>
              </span>
              <span className="block text-xs text-muted">{mins(t) ? `${mins(t)} min` : times(count(t))}</span>
            </RegisterSheet>
          ),
        )}
      </div>

      <WeekStrip week={week} />
      {showRegisterAll ? (
        <RegisterSheet today={today} weightKg={weightKg} nicknames={nicknames} label="+ Registrar otro entreno" className="w-full" />
      ) : (
        <p className="text-center text-xs text-muted">Tocá un bloque para sumarlo. Elegí tus deportes en Ajustes; el resto, desde Entrenos.</p>
      )}
    </div>
  );
}
