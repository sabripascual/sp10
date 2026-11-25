import { Avatar } from "@/components/shell/avatar";
import { LEVELS } from "@/lib/level";
import { closedRanking, liveRanking, liveSteps, passedBy, weekAwards, type ClubMember } from "@/lib/club";
import { cn } from "@/lib/utils";

// Del amarillo (arriba) al gris (abajo)
const STEP_TONE = ["bg-accent text-accent-fg", "bg-[#ccbb00] text-black", "bg-[#8a7f10] text-white", "bg-[#4a4a4a] text-white", "bg-[#363636] text-white", "bg-[#262626] text-[#d4d4d4]"];
const MOVE = { up: { t: "▲", c: "text-[#4ade80]" }, down: { t: "▼", c: "text-[#fb923c]" }, same: { t: "•", c: "text-muted" } };
const short = (name: string) => name.replace("Perrita ", "").replace("promedio de la humanidad", "promedio");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Face({ m, size = "size-10", ring }: { m: ClubMember; size?: string; ring?: string }) {
  return (
    <Avatar
      url={m.avatar}
      className={cn(size, "bg-[#4a4a4a]", m.isMe ? "ring-[3px] ring-accent" : ring ?? "ring-2 ring-surface")}
      emojiClass="text-lg"
    />
  );
}

/** Durante la semana: los 6 escalones, cada una donde cerraría si la semana terminara hoy. */
export function LiveSteps({ members, daysLeft, myMissing }: { members: ClubMember[]; daysLeft: number; myMissing: string }) {
  const steps = liveSteps(members);
  const passer = passedBy(members);
  const me = members.find((m) => m.isMe);
  const meLevel = me ? LEVELS.find((l) => l.key === me.live.level)! : null;
  const pos = me ? liveRanking(members).findIndex((m) => m.isMe) + 1 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Si la semana cerrara hoy…</p>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-extrabold">
          <span className="size-2 animate-pulse rounded-full bg-[#ff5a5a]" />
          En vivo · {daysLeft === 1 ? "cierra hoy" : `cierra en ${daysLeft} días`}
        </span>
      </div>

      {passer && (
        <div className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5">
          <Face m={passer} size="size-8" />
          <p className="flex-1 text-sm">
            <strong>{passer.name} te pasó</strong> 👀 Estás a {passer.live.score - me!.live.score + 1} pts de recuperar el lugar.
          </p>
        </div>
      )}

      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.level.key} className="flex items-stretch gap-2">
            <div className={cn("flex w-[74px] shrink-0 flex-col items-center justify-center rounded-xl px-1 py-1.5", STEP_TONE[i])}>
              <span className="text-[22px] leading-none">{s.level.emoji}</span>
              <span className="mt-0.5 text-center text-[10px] font-black leading-tight">{cap(short(s.level.name))}</span>
            </div>
            <div
              className="flex min-h-[64px] flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-surface bg-[#161616] px-2.5 py-2"
              style={{ marginLeft: `${i * 6}px` }}
            >
              {s.people.length === 0 ? (
                <span className="text-xs text-muted">Nadie por acá todavía</span>
              ) : (
                s.people.map(({ member: m, move }) => (
                  <div key={m.id} className="flex w-12 flex-col items-center gap-0.5">
                    <span className="relative">
                      <Face m={m} />
                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-black px-0.5 text-[11px] font-black",
                          MOVE[move].c,
                        )}
                        aria-label={move === "up" ? "subió" : move === "down" ? "bajó" : "igual"}
                      >
                        {MOVE[move].t}
                      </span>
                    </span>
                    <span className={cn("max-w-12 truncate text-[11px] font-extrabold", m.isMe ? "text-accent" : "text-[#d4d4d4]")}>
                      {m.isMe ? "Vos" : m.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </li>
        ))}
      </ol>

      {me && meLevel && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-accent-fg">
          <div className="min-w-0">
            <p className="text-xs font-extrabold">Vos vas {pos}ª</p>
            <p className="truncate text-lg font-black">
              {meLevel.emoji} {cap(short(meLevel.name))} · {me.live.pct}% de tu semana
            </p>
          </div>
          <span className="shrink-0 text-right text-xs font-black leading-tight">
            {myMissing ? (
              <>
                Te falta
                <br />
                {myMissing}
              </>
            ) : (
              <>
                ¡Semana
                <br />
                cumplida! 👑
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/** El lunes: podio de la semana que cerró, premios y cómo quedó cada una. */
export function Podium({ members }: { members: ClubMember[] }) {
  const ranked = closedRanking(members);
  if (!ranked.length)
    return <p className="rounded-2xl bg-surface p-5 text-sm text-muted">Todavía nadie cerró una semana completa. El lunes sale el primer podio 🏆</p>;
  const [first, second, third] = ranked;
  const awards = weekAwards(members);
  const byLevel = [...LEVELS].reverse().map((l) => ({ l, who: ranked.filter((m) => m.closed!.level === l.key) })).filter((x) => x.who.length);
  const lvl = (m: ClubMember) => LEVELS.find((l) => l.key === m.closed!.level)!;

  const Spot = ({ m, place }: { m?: ClubMember; place: 1 | 2 | 3 }) =>
    m ? (
      <div className="flex flex-col items-center gap-1.5">
        {place === 1 && <span className="text-3xl leading-none">👑</span>}
        <Face
          m={m}
          size={place === 1 ? "size-20" : place === 2 ? "size-16" : "size-[60px]"}
          ring={place === 1 ? "ring-4 ring-accent shadow-[0_0_30px_rgba(255,233,0,0.4)]" : place === 2 ? "ring-[3px] ring-[#d4d4d4]" : "ring-[3px] ring-[#b08d57]"}
        />
        <p className={cn("max-w-full truncate text-sm font-black", m.isMe && "text-accent")}>{m.isMe ? "Vos" : m.name}</p>
        <p className="text-xs text-muted">
          {lvl(m).emoji} {m.closed!.score} pts
        </p>
        <div
          className={cn(
            "flex w-full justify-center rounded-t-xl pt-2 font-black",
            place === 1 ? "h-32 bg-accent text-4xl text-accent-fg" : place === 2 ? "h-24 bg-[#3a3a3a] text-3xl" : "h-[72px] bg-surface text-2xl",
          )}
        >
          {place}
        </div>
      </div>
    ) : (
      <div />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 items-end gap-2 pt-2">
        <Spot m={second} place={2} />
        <Spot m={first} place={1} />
        <Spot m={third} place={3} />
      </div>

      {awards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Premios de la semana</p>
          <div className="grid grid-cols-3 gap-1.5">
            {awards.map((a) => (
              <div key={a.key} className="rounded-xl bg-surface px-2 py-2.5 text-center">
                <p className="text-[22px]">{a.emoji}</p>
                <p className="mt-0.5 text-[11px] font-black leading-tight">{a.title}</p>
                <p className={cn("mt-0.5 truncate text-xs font-extrabold", "text-accent")}>{a.who.isMe ? "¡Vos!" : a.who.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Así quedó cada una</p>
        {byLevel.map(({ l, who }) => (
          <div key={l.key} className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2">
            <span className="w-6 text-center text-xl">{l.emoji}</span>
            <span className="flex-1 text-sm font-extrabold">{cap(short(l.name))}</span>
            <span className="flex -space-x-2">
              {who.slice(0, 5).map((m) => (
                <Face key={m.id} m={m} size="size-7" ring="ring-2 ring-surface" />
              ))}
            </span>
            <span className="max-w-28 truncate text-xs text-[#d4d4d4]">{who.map((m) => (m.isMe ? "Vos" : m.name)).join(", ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
