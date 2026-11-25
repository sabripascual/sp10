import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-data";
import { localDate, shiftDate, type FastDay } from "@/lib/fast";
import { sinceDate } from "@/lib/fast-data";
import { weekStart } from "@/lib/week";
import { profileGoals } from "@/lib/goals";
import { firstGradedWeek, levelFor, weekScore, type LevelKey } from "@/lib/level";
import { weekSummaries } from "@/lib/progress";
import { allClubStandings } from "@/lib/club-data";
import { closedRanking } from "@/lib/club";
import type { Profile } from "@/lib/profile";

const WEEKS = 9; // 8 cerradas + la en curso

export type RankRow = { id: string; name: string; score: number; level: LevelKey; streak: number; daysPerWeek: number };

/**
 * "Ringo en números" (solo admin): uso, frecuencia, clubes, ranking general y tendencia.
 * Nunca pesos, medidas ni fotos: solo niveles, puntos, días de uso y clubes.
 */
export async function getRingoNumbers() {
  await requireAdmin();
  const db = createAdminClient();
  const now = new Date();
  const today = localDate(now, "America/Argentina/Tucuman");
  const current = weekStart(today);
  const from = shiftDate(current, -7 * (WEEKS - 1));
  const last28 = shiftDate(today, -27);

  const [{ data: profilesData }, { data: fasts }, { data: workouts }, { data: events }, { data: checks }, clubs] = await Promise.all([
    db.from("profiles").select("*"),
    db.from("fast_days").select("user_id, date, status, broken_at, extra_hours, event_id, started_at, ended_at, updated_at").gte("date", shiftDate(from, -1)).order("date"),
    db.from("workouts").select("id, user_id, date, type, minutes, status, created_at").gte("date", from),
    db.from("events").select("user_id, date, compensated_at, compensated_by, created_at").gte("date", shiftDate(from, -7)),
    db.from("body_checks").select("user_id, date"),
    allClubStandings(db, now),
  ]);
  const profiles = ((profilesData ?? []) as Profile[]).filter((p) => p.role !== "pending");
  const active = profiles.filter((p) => p.role !== "disabled");
  const nameOf = (p: Profile) => p.display_name || p.club_name || p.nicknames?.[0] || "Sin nombre";

  // Días con algún registro (últimos 28) por usuaria
  const days = new Map<string, Set<string>>();
  const mark = (uid: string, d: string | null | undefined) => {
    if (!d || d < last28 || d > today) return;
    if (!days.has(uid)) days.set(uid, new Set());
    days.get(uid)!.add(d);
  };
  for (const w of workouts ?? []) mark(w.user_id, w.date);
  for (const f of fasts ?? []) if (f.started_at || f.ended_at || f.broken_at) mark(f.user_id, f.date);
  for (const e of events ?? []) mark(e.user_id, String(e.created_at).slice(0, 10));
  for (const c of checks ?? []) mark(c.user_id, c.date);
  const perWeek = (uid: string) => Math.round(((days.get(uid)?.size ?? 0) / 4) * 10) / 10;

  // Niveles por semana de cada una (8 semanas cerradas)
  const byUser = <T extends { user_id: string }>(rows: T[] | null, uid: string) => (rows ?? []).filter((r) => r.user_id === uid);
  const graded = active.map((p) => {
    const records = new Map((byUser(fasts as (FastDay & { user_id: string })[], p.id)).map((r) => [r.date, r]));
    const since = sinceDate(p, records);
    const weeks = weekSummaries({
      now,
      cfg: p,
      since,
      records,
      workouts: byUser(workouts, p.id),
      events: byUser(events, p.id),
      goals: (ws) => profileGoals(p, ws),
      weeks: WEEKS,
    });
    const first = firstGradedWeek(since);
    const scores = weeks.slice(0, -1).map((w) => (w.weekStart >= first ? weekScore(w) : null));
    return { p, scores };
  });

  // Ranking general: última semana cerrada
  const ranking: RankRow[] = graded
    .filter((g) => g.scores.at(-1) !== null)
    .map(({ p, scores }) => {
      let streak = 0;
      for (let i = scores.length - 1; i >= 0 && (scores[i] ?? -1) >= 60; i--) streak++;
      const score = scores.at(-1)!;
      return { id: p.id, name: nameOf(p), score, level: levelFor(score).key, streak, daysPerWeek: perWeek(p.id) };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const levelCounts = Object.fromEntries(["pajera", "vagoneta", "promedio", "motivada", "crack", "dios"].map((k) => [k, 0])) as Record<LevelKey, number>;
  for (const r of ranking) levelCounts[r.level]++;

  // Tendencia: puntaje promedio de cada semana cerrada
  const trend = Array.from({ length: WEEKS - 1 }, (_, i) => {
    const vals = graded.map((g) => g.scores[i]).filter((v): v is number => v !== null);
    return { weekStart: shiftDate(current, -7 * (WEEKS - 1 - i)), avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null, n: vals.length };
  });

  // Frecuencia de uso
  const freq = { "0": 0, "1-2": 0, "3-4": 0, "5-7": 0 };
  for (const p of active) {
    const d = perWeek(p.id);
    if (d < 0.5) freq["0"]++;
    else if (d < 2.5) freq["1-2"]++;
    else if (d < 4.5) freq["3-4"]++;
    else freq["5-7"]++;
  }
  const avgDays = active.length ? Math.round((active.reduce((a, p) => a + perWeek(p.id), 0) / active.length) * 10) / 10 : 0;
  const activeIn = (n: number) => active.filter((p) => [...(days.get(p.id) ?? [])].some((d) => d >= shiftDate(today, -(n - 1)))).length;

  // Nuevas por semana (últimas 4)
  const newByWeek = Array.from({ length: 4 }, (_, i) => {
    const ws = shiftDate(current, -7 * (3 - i));
    const we = shiftDate(ws, 7);
    return { weekStart: ws, n: profiles.filter((p) => { const d = String(p.created_at).slice(0, 10); return d >= ws && d < we; }).length };
  });

  // Clubes
  const clubRows = clubs
    .map((c) => {
      const ranked = closedRanking(c.members);
      const avg = ranked.length ? Math.round(ranked.reduce((a, m) => a + m.closed!.score, 0) / ranked.length) : null;
      const owner = profiles.find((p) => p.id === c.ownerId);
      return { id: c.id, name: c.name, owner: owner ? nameOf(owner) : "—", members: c.members.length, avg, avgLevel: avg === null ? null : levelFor(avg).key, winner: ranked[0]?.name ?? null };
    })
    .sort((a, b) => b.members - a.members);

  return {
    users: {
      total: active.length,
      active7: activeIn(7),
      active30: activeIn(28),
      pending: ((profilesData ?? []) as Profile[]).filter((p) => p.role === "pending").length,
      newByWeek,
    },
    frequency: { avgDays, buckets: freq },
    clubs: clubRows,
    ranking,
    levelCounts,
    trend,
  };
}
