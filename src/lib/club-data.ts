import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, type Profile } from "@/lib/profile";
import { localDate, shiftDate, type FastDay } from "@/lib/fast";
import { sinceDate } from "@/lib/fast-data";
import { weekStart } from "@/lib/week";
import { goalsOf } from "@/lib/goals";
import { firstGradedWeek, levelFor, weekScore, type LevelKey } from "@/lib/level";
import { weekGoals, weekSummaries } from "@/lib/progress";
import { avatarUrl } from "@/lib/avatar";

export type ClubMember = {
  id: string;
  name: string;
  avatar: string | null;
  isMe: boolean;
  /** Nivel de la última semana cerrada (null = todavía no tiene una semana completa). */
  level: LevelKey | null;
  score: number | null;
  /** Cómo va la semana en curso (% de su semana ideal). */
  weekPct: number;
};

export type ClubData = { me: Profile; joined: boolean; weekStart: string; members: ClubMember[] };

/**
 * Ranking del Ringo Club. Se calcula con service role (cada una solo puede leer lo suyo por RLS),
 * pero SOLO de quienes se sumaron, y devuelve únicamente nombre, foto de perfil, nivel, puntos y % de la semana.
 */
export async function getClubData(): Promise<ClubData> {
  const me = await getProfile();
  const now = new Date();
  const today = localDate(now, me.timezone);
  const lastWeek = shiftDate(weekStart(today), -7);
  const from = shiftDate(lastWeek, -1);
  const joined = Boolean(me.club_visible && me.club_name);
  if (!joined) return { me, joined, weekStart: lastWeek, members: [] };

  const db = createAdminClient();
  const { data: profiles, error } = await db
    .from("profiles")
    .select("*")
    .eq("club_visible", true)
    .not("club_name", "is", null)
    .neq("role", "disabled");
  if (error) throw new Error(`No pude leer el club: ${error.message}`);
  const ids = (profiles ?? []).map((p) => p.id as string);
  if (!ids.length) return { me, joined, weekStart: lastWeek, members: [] };

  const [fasts, workouts, events] = await Promise.all([
    db.from("fast_days").select("user_id, date, status, broken_at, extra_hours, event_id, started_at, ended_at").in("user_id", ids).gte("date", from),
    db.from("workouts").select("user_id, date, type, minutes, status").in("user_id", ids).gte("date", lastWeek),
    db.from("events").select("user_id, date, compensated_at").in("user_id", ids).gte("date", lastWeek),
  ]);
  for (const r of [fasts, workouts, events]) if (r.error) throw new Error(`No pude leer el club: ${r.error.message}`);

  const members: ClubMember[] = (profiles as Profile[]).map((p) => {
    const mine = <T extends { user_id: string }>(rows: T[] | null) => (rows ?? []).filter((r) => r.user_id === p.id);
    const records = new Map(mine(fasts.data as (FastDay & { user_id: string })[]).map((r) => [r.date, r]));
    const since = sinceDate(p, records);
    const [closed, current] = weekSummaries({
      now,
      cfg: p,
      since,
      records,
      workouts: mine(workouts.data),
      events: mine(events.data),
      goals: goalsOf(p.weekly_goals, p.strength_goal),
      weeks: 2,
    });
    const graded = closed.weekStart >= firstGradedWeek(since);
    const score = graded ? weekScore(closed) : null;
    return {
      id: p.id,
      name: p.club_name!,
      avatar: avatarUrl(p.avatar_path),
      isMe: p.id === me.id,
      level: score === null ? null : levelFor(score).key,
      score,
      weekPct: weekGoals(current).pct,
    };
  });

  members.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.weekPct - a.weekPct || a.name.localeCompare(b.name));
  return { me, joined, weekStart: lastWeek, members };
}
