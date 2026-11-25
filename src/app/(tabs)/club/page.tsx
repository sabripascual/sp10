import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { getClubData, type ClubMember } from "@/lib/club-data";
import { LEVELS } from "@/lib/level";
import { cn } from "@/lib/utils";
import { JoinForm } from "./join-form";
import { Avatar } from "@/components/shell/avatar";

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;
const MEDAL = ["🥇", "🥈", "🥉"];
const levelOf = (m: ClubMember) => LEVELS.find((l) => l.key === m.level);

export default async function ClubPage() {
  const { me, joined, weekStart, members } = await getClubData();

  if (!joined) {
    return (
      <>
        <PageHeader title="Ringo Club" subtitle="El ranking de las perritas." />
        <Card className="space-y-4">
          <div className="text-center text-6xl">🐶🏆</div>
          <div>
            <CardTitle>¿Te sumás?</CardTitle>
            <CardDescription className="mt-1">
              Cada lunes, el ranking muestra en qué nivel de perrita cerró la semana cada una. Las demás solo ven tu nombre, tu foto de perfil,
              tu nivel, tus puntos y el % de tu semana. Nunca ven tu peso, tus medidas ni tus fotos. Salís cuando quieras.
            </CardDescription>
          </div>
          <JoinForm initialName={me.club_name ?? ""} joined={false} />
        </Card>
      </>
    );
  }

  const ranked = members.filter((m) => m.score !== null);
  const newbies = members.filter((m) => m.score === null);

  return (
    <>
      <PageHeader title="Ringo Club" subtitle={`Cómo cerró la semana del ${dm(weekStart)}.`} />
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl bg-surface p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Ranking</p>
          {ranked.length === 0 ? (
            <p className="text-sm text-muted">Todavía nadie cerró una semana completa. El lunes sale el primer ranking.</p>
          ) : (
            <ol className="space-y-2">
              {ranked.map((m, i) => {
                const lvl = levelOf(m)!;
                return (
                  <li key={m.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", m.isMe ? "bg-accent text-accent-fg" : "bg-bg")}>
                    <span className="w-7 text-center text-lg font-black tabular-nums">{MEDAL[i] ?? i + 1}</span>
                    <span className="relative shrink-0">
                      <Avatar url={m.avatar} className="size-11 bg-surface" emojiClass="text-2xl" />
                      <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-bg text-sm">{lvl.emoji}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">
                        {m.name}
                        {m.isMe && " (vos)"}
                      </p>
                      <p className={cn("truncate text-xs", m.isMe ? "text-accent-fg/70" : "text-muted")}>
                        {lvl.name} · esta semana {m.weekPct}%
                      </p>
                    </div>
                    <span className="text-xl font-black tabular-nums">{m.score}</span>
                  </li>
                );
              })}
            </ol>
          )}
          {newbies.length > 0 && (
            <p className="text-xs text-muted">
              🐣 Recién llegadas (su primer nivel sale cuando cierren una semana completa): {newbies.map((m) => m.name).join(", ")}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl bg-surface p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Por nivel</p>
          <ul className="space-y-2">
            {[...LEVELS].reverse().map((l) => {
              const here = ranked.filter((m) => m.level === l.key);
              return (
                <li key={l.key} className={cn("flex items-start gap-3 rounded-xl bg-bg px-3 py-2.5", !here.length && "opacity-50")}>
                  <span className="text-2xl">{l.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {l.name} <span className="text-muted">· {l.min}+ pts</span>
                    </p>
                    {here.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {here.map((m) => (
                          <span
                            key={m.id}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs font-bold",
                              m.isMe ? "bg-accent text-accent-fg" : "bg-surface",
                            )}
                          >
                            <Avatar url={m.avatar} className="size-6 bg-bg" emojiClass="text-xs" />
                            {m.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">Nadie esta semana</p>
                    )}
                  </div>
                  <span className="text-lg font-black tabular-nums">{here.length}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <Card className="space-y-3">
          <div>
            <CardTitle>Tu lugar en el club</CardTitle>
            <CardDescription className="mt-1">Las demás ven tu nombre, tu foto de perfil, nivel, puntos y % de la semana. Nada más.</CardDescription>
          </div>
          <JoinForm initialName={me.club_name ?? ""} joined />
        </Card>
      </div>
    </>
  );
}
