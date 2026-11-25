import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, type Profile } from "@/lib/profile";
import { localDate, shiftDate, type FastDay } from "@/lib/fast";
import { sinceDate } from "@/lib/fast-data";
import { isoDay, weekStart } from "@/lib/week";
import { missingText, profileGoals } from "@/lib/goals";
import { firstGradedWeek, levelFor, weekScore } from "@/lib/level";
import { weekGoals, weekSummaries } from "@/lib/progress";
import { avatarUrl } from "@/lib/avatar";
import type { ClubMember } from "@/lib/club";
import { withFallback } from "@/lib/db-fallback";

export type ClubData = {
  me: Profile;
  joined: boolean;
  /** Lunes de la semana que cerró. */
  closedWeek: string;
  isMonday: boolean;
  /** Días que faltan para que cierre la semana en curso (incluye hoy). */
  daysLeft: number;
  members: ClubMember[];
  /** Lo que te falta a vos esta semana ("1 fierrito y 2 ayunos"). Solo tuyo. */
  myMissing: string;
};

type Db = ReturnType<typeof createAdminClient>;

/**
 * Nivel de una usuaria en la semana que cerró, la anterior y la en curso (hoy y ayer).
 * Se usa en el Club y en el cron (avisos del Club). Solo devuelve puntos, niveles y %.
 */
export async function clubStanding(db: Db, p: Profile, now: Date) {
  const today = localDate(now, p.timezone);
  const current = weekStart(today);
  const from = shiftDate(current, -15);
  const [fasts, workouts, events] = await Promise.all([
    db.from("fast_days").select("date, status, broken_at, extra_hours, event_id, started_at, ended_at").eq("user_id", p.id).order("date"),
    db.from("workouts").select("id, date, type, minutes, status").eq("user_id", p.id).gte("date", from),
    withFallback(db.from("events").select("date, compensated_at, compensated_by").eq("user_id", p.id).gte("date", from), () =>
      db.from("events").select("date, compensated_at").eq("user_id", p.id).gte("date", from),
    ),
  ]);
  const records = new Map(((fasts.data ?? []) as FastDay[]).map((r) => [r.date, r]));
  const since = sinceDate(p, records);
  const input = { cfg: p, since, records, workouts: workouts.data ?? [], events: events.data ?? [], goals: (ws: string) => profileGoals(p, ws), weeks: 3 };
  const [prevW, closedW, liveW] = weekSummaries({ ...input, now });
  const graded = firstGradedWeek(since);
  const grade = (w: typeof closedW) => {
    const score = weekScore(w);
    return { score, level: levelFor(score).key, pct: weekGoals(w).pct };
  };
  // Ayer, dentro de la misma semana (el lunes no hay "ayer" en esta semana)
  let liveYesterday: ClubMember["liveYesterday"] = null;
  if (isoDay(today) !== 1) {
    const y = weekSummaries({ ...input, now: new Date(now.getTime() - 86_400_000), weeks: 1 })[0];
    const s = weekScore(y);
    liveYesterday = { score: s, level: levelFor(s).key };
  }
  return {
    closed: closedW.weekStart >= graded ? grade(closedW) : null,
    prev: prevW.weekStart >= graded ? (({ score, level }) => ({ score, level }))(grade(prevW)) : null,
    live: grade(liveW),
    liveYesterday,
    missing: missingText(weekGoals(liveW).items),
  };
}

/** Miembros del Club (sumadas con nombre, cuenta no pausada). */
export async function clubMembers(db: Db) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("club_visible", true)
    .not("club_name", "is", null)
    .neq("role", "disabled");
  if (error) throw new Error(`No pude leer el club: ${error.message}`);
  return (data ?? []) as Profile[];
}

/**
 * Ringo Club. Se calcula con service role (cada una solo puede leer lo suyo por RLS),
 * SOLO de quienes se sumaron, y devuelve únicamente nombre, foto de perfil, niveles, puntos y %.
 */
export async function getClubData(): Promise<ClubData> {
  const me = await getProfile();
  const now = new Date();
  const today = localDate(now, me.timezone);
  const closedWeek = shiftDate(weekStart(today), -7);
  const base = { me, closedWeek, isMonday: isoDay(today) === 1, daysLeft: 8 - isoDay(today), myMissing: "" };
  const joined = Boolean(me.club_visible && me.club_name);
  if (!joined) return { ...base, joined, members: [] };

  const db = createAdminClient();
  const profiles = await clubMembers(db);
  let myMissing = "";
  const members: ClubMember[] = await Promise.all(
    profiles.map(async (p) => {
      const s = await clubStanding(db, p, now);
      if (p.id === me.id) myMissing = s.missing;
      return {
        id: p.id,
        name: p.club_name!,
        avatar: avatarUrl(p.avatar_path),
        isMe: p.id === me.id,
        closed: s.closed,
        prev: s.prev,
        live: s.live,
        liveYesterday: s.liveYesterday,
      };
    }),
  );
  return { ...base, joined, members, myMissing };
}
