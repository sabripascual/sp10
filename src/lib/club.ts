// Ringo Club: podio, premios, escalones en vivo y figurita. Lógica pura (cliente y servidor).
import { LEVELS, levelFor, type LevelKey } from "@/lib/level";

export type ClubMember = {
  id: string;
  name: string;
  avatar: string | null;
  isMe: boolean;
  /** Semana que cerró (null = todavía no tiene una semana completa calificada). */
  closed: { score: number; level: LevelKey; pct: number } | null;
  /** La anterior a esa (para subió/bajó y la remontada). */
  prev: { score: number; level: LevelKey } | null;
  /** Semana en curso: dónde cerraría si terminara hoy. */
  live: { score: number; level: LevelKey; pct: number };
  /** Lo mismo pero ayer (null el lunes: la semana recién empieza). */
  liveYesterday: { score: number; level: LevelKey } | null;
};

const idx = (k: LevelKey) => LEVELS.findIndex((l) => l.key === k);
const short = (k: LevelKey) => LEVELS[idx(k)].name.replace("Perrita ", "");

/** Frase de la figurita según la perrita. */
export const FIGURITA_QUOTES: Record<LevelKey, string> = {
  dios: "Te pedimos un autógrafo. Inalcanzable.",
  crack: "Ni el Dibu ataja tanta constancia.",
  motivada: "Un empujoncito más y te codeás con las cracks.",
  promedio: "Ni fu ni fa. Esta semana la rompemos.",
  vagoneta: "El sillón te quiere, pero el lunes es tuyo.",
  pajera: "Pasa en las mejores familias. Hoy arrancamos de cero.",
};

/** Número de figurita estable por persona (1-99). */
export function figuritaNumber(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String((h % 99) + 1).padStart(2, "0");
}

/** "Subiste de motivada a crack, esaaa 📈" / "Bajaste…" / "Te mantuviste…" / null si no hay semana anterior. */
export function changeText(level: LevelKey, prev: LevelKey | null) {
  if (!prev) return "Tu primera figurita 🐣 ¡Bienvenida al álbum!";
  if (prev === level) return "Te mantuviste: firme como rulo de estatua";
  return idx(level) > idx(prev)
    ? `Subiste de ${short(prev)} a ${short(level)}, esaaa 📈`
    : "Bajaste un escalón, nada que unos fierritos no arreglen";
}

/** Ranking de la semana que cerró, de mayor a menor (desempata el nombre). */
export function closedRanking(members: ClubMember[]) {
  return members
    .filter((m) => m.closed)
    .sort((a, b) => b.closed!.score - a.closed!.score || a.name.localeCompare(b.name));
}

/** Ranking en vivo de la semana en curso. */
export function liveRanking(members: ClubMember[]) {
  return [...members].sort((a, b) => b.live.score - a.live.score || b.live.pct - a.live.pct || a.name.localeCompare(b.name));
}

export type Award = { key: "picante" | "remontada" | "sillon"; emoji: string; title: string; who: ClubMember };

/** Premios cariñosos de la semana cerrada. El sillón de oro solo con 3 o más (con 2 sería señalar a una). */
export function weekAwards(members: ClubMember[]): Award[] {
  const ranked = closedRanking(members);
  if (!ranked.length) return [];
  const out: Award[] = [{ key: "picante", emoji: "🌶️", title: "La más picante", who: ranked[0] }];
  const climbs = ranked
    .filter((m) => m.prev && m.closed!.score > m.prev.score)
    .sort((a, b) => b.closed!.score - b.prev!.score - (a.closed!.score - a.prev!.score));
  if (climbs[0] && climbs[0].id !== ranked[0].id) out.push({ key: "remontada", emoji: "🚀", title: "Remontada del año", who: climbs[0] });
  if (ranked.length >= 3) out.push({ key: "sillon", emoji: "🛋️", title: "Sillón de oro", who: ranked.at(-1)! });
  return out;
}

/** Escalones en vivo: de nivel dios (arriba) a pajera (abajo), con quién está en cada uno y si subió/bajó desde ayer. */
export function liveSteps(members: ClubMember[]) {
  return [...LEVELS].reverse().map((l) => ({
    level: l,
    people: liveRanking(members)
      .filter((m) => m.live.level === l.key)
      .map((m) => ({
        member: m,
        move: !m.liveYesterday ? ("same" as const) : idx(m.live.level) > idx(m.liveYesterday.level) ? ("up" as const) : idx(m.live.level) < idx(m.liveYesterday.level) ? ("down" as const) : ("same" as const),
      })),
  }));
}

/** ¿Alguien te pasó desde ayer en la semana en curso? (la primera que te pasó) */
export function passedBy(members: ClubMember[]) {
  const me = members.find((m) => m.isMe);
  if (!me?.liveYesterday) return null;
  return (
    members.find(
      (m) => !m.isMe && m.liveYesterday && m.liveYesterday.score <= me.liveYesterday!.score && m.live.score > me.live.score,
    ) ?? null
  );
}

/** Cuántos puntos te faltan para subir de escalón en vivo (null si ya sos nivel dios). */
export function pointsToNextLevel(score: number) {
  const next = LEVELS.find((l) => l.min > score);
  return next ? { level: next, pts: next.min - score } : null;
}

export { levelFor };
