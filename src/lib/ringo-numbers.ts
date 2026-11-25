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

  const [{ data: profilesData }, { data: fasts }, { data: workouts }, { data: events }, { data: checks }, clubs, { data: subs }, { data: memberships }] = await Promise.all([
    db.from("profiles").select("*"),
    db.from("fast_days").select("user_id, date, status, broken_at, extra_hours, event_id, started_at, ended_at, updated_at").gte("date", shiftDate(from, -1)).order("date"),
    db.from("workouts").select("id, user_id, date, type, minutes, status, created_at").gte("date", from),
    db.from("events").select("user_id, date, compensated_at, compensated_by, created_at").gte("date", shiftDate(from, -7)),
    db.from("body_checks").select("user_id, date"),
    allClubStandings(db, now),
    db.from("push_subscriptions").select("user_id"),
    db.from("club_members").select("user_id"),
  ]);
  const profiles = ((profilesData ?? []) as Profile[]).filter((p) => p.role !== "pending");
  const active = profiles.filter((p) => p.role !== "disabled");
  const nameOf = (p: Profile) => p.display_name || p.club_name || p.nicknames?.[0] || "Sin nombre";

  // Días con algún registro por usuaria (todo lo cargado: ~9 semanas). `days` = últimos 28.
  const allDays = new Map<string, Set<string>>();
  const days = new Map<string, Set<string>>();
  const mark = (uid: string, d: string | null | undefined) => {
    if (!d || d > today) return;
    if (!allDays.has(uid)) allDays.set(uid, new Set());
    allDays.get(uid)!.add(d);
    if (d < last28) return;
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

  // ── 1. En riesgo: 7+ días sin anotar nada (cuentas de 7+ días) ──
  const lastDay = (uid: string) => [...(allDays.get(uid) ?? [])].sort().at(-1) ?? null;
  const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
  const atRisk = active
    .filter((p) => p.role === "user" || p.role === "admin")
    .map((p) => {
      const last = lastDay(p.id);
      const created = String(p.created_at).slice(0, 10);
      return { id: p.id, name: nameOf(p), whatsapp: p.whatsapp ?? null, last, since: last ? daysBetween(last, today) : null, created };
    })
    .filter((r) => daysBetween(r.created, today) >= 7 && (r.since === null || r.since >= 7))
    .sort((a, b) => (b.since ?? 999) - (a.since ?? 999));

  // ── 2. Retención por cohorte (semana de alta): % con actividad en la semana 1, 2 y 4 después ──
  const activeBetween = (uid: string, a: string, b: string) => [...(allDays.get(uid) ?? [])].some((d) => d >= a && d < b);
  const cohorts = Array.from({ length: 6 }, (_, i) => {
    const ws = shiftDate(current, -7 * (6 - i));
    const members = profiles.filter((p) => {
      const d = String(p.created_at).slice(0, 10);
      return d >= ws && d < shiftDate(ws, 7);
    });
    const rate = (k: number) => {
      const start = shiftDate(ws, 7 * k);
      if (start > today) return null; // todavía no llegó esa semana
      if (!members.length) return null;
      const n = members.filter((p) => activeBetween(p.id, start, shiftDate(start, 7))).length;
      return Math.round((n / members.length) * 100);
    };
    return { weekStart: ws, n: members.length, w1: rate(1), w2: rate(2), w4: rate(4) };
  }).filter((c) => c.n > 0);

  // ── 3. Activación: lo básico completado ──
  const withPush = new Set((subs ?? []).map((s) => s.user_id as string));
  const inClub = new Set((memberships ?? []).map((m) => m.user_id as string));
  const pctOf = (fn: (p: Profile) => boolean) => (active.length ? Math.round((active.filter(fn).length / active.length) * 100) : 0);
  const activation = [
    { key: "semana", label: "Armó su semana ideal", pct: pctOf((p) => Boolean(p.weekly_goals) || (p.goals_history?.length ?? 0) > 0) },
    { key: "avisos", label: "Activó los avisos", pct: pctOf((p) => withPush.has(p.id)) },
    { key: "foto", label: "Puso foto", pct: pctOf((p) => Boolean(p.avatar_path)) },
    { key: "club", label: "Está en un club", pct: pctOf((p) => inClub.has(p.id)) },
  ];

  // ── 4. Uso por función (últimos 28 días) ──
  const used = (rows: { user_id: string; d: string | null }[]) => new Set(rows.filter((r) => r.d && r.d >= last28 && r.d <= today).map((r) => r.user_id));
  const fastUsers = used((fasts ?? []).filter((f) => f.started_at || f.ended_at || f.broken_at).map((f) => ({ user_id: f.user_id, d: f.date })));
  const workoutUsers = used((workouts ?? []).map((w) => ({ user_id: w.user_id, d: w.date })));
  const eventUsers = used((events ?? []).map((e) => ({ user_id: e.user_id, d: String(e.created_at).slice(0, 10) })));
  const bodyUsers = used((checks ?? []).map((c) => ({ user_id: c.user_id, d: c.date })));
  const share = (set: Set<string>) => (active.length ? Math.round((active.filter((p) => set.has(p.id)).length / active.length) * 100) : 0);
  const features = [
    { key: "entrenos", label: "Cargó entrenos", pct: share(workoutUsers) },
    { key: "ayuno", label: "Marcó ayunos", pct: share(fastUsers), note: `${pctOf((p) => p.fasting_enabled !== false)}% lo tiene prendido` },
    { key: "derrapes", label: "Agendó derrapes", pct: share(eventUsers) },
    { key: "cuerpo", label: "Hizo un control", pct: share(bodyUsers) },
  ];

  return {
    atRisk,
    cohorts,
    activation,
    features,
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
