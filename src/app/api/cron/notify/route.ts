import { NextResponse, type NextRequest } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfigured, sendPush, type Subscription } from "@/lib/push";
import { localDate, shiftDate, type FastDay } from "@/lib/fast";
import { sinceDate } from "@/lib/fast-data";
import { nextCheckDate } from "@/lib/body";
import { isoDay, weekStart } from "@/lib/week";
import { dueNotifications } from "@/lib/notify-rules";
import { CLOSING_AT, coachNotifications, LEVEL_AT, PODIUM_AT } from "@/lib/coach-notify";
import { clubMembers, clubStanding } from "@/lib/club-data";
import { closedRanking, liveRanking, type ClubMember } from "@/lib/club";
import { getCoachPrefs } from "@/lib/app-settings";
import { buildMessage, URLS, type NotifyKind } from "@/lib/phrases";
import { profileGoals } from "@/lib/goals";
import { firstGradedWeek, levelHistory } from "@/lib/level";
import { fastStreaks, strengthWeekStreaks, summaryText, weekGoals, weekSummaries } from "@/lib/progress";
import type { Profile } from "@/lib/profile";

export const dynamic = "force-dynamic";

const WEEKS = 13; // para el nivel (semana cerrada y la anterior) y los hitos de fierritos (hasta 12 semanas)

type Row = { created_at?: string; updated_at?: string };

/** Todo lo que hace falta de una usuaria para decidir sus avisos. */
async function loadUser(db: ReturnType<typeof createAdminClient>, p: Profile, now: Date) {
  const tz = p.timezone;
  const today = localDate(now, tz);
  const from = shiftDate(weekStart(today), -7 * (WEEKS - 1));
  const [fasts, workouts, events, checks] = await Promise.all([
    // todos los ayunos cargados: "sin fila = cumplido", así que para la racha hacen falta todos
    db.from("fast_days").select("date, status, broken_at, extra_hours, event_id, started_at, ended_at, updated_at").eq("user_id", p.id).order("date"),
    db.from("workouts").select("date, type, minutes, status, created_at").eq("user_id", p.id).gte("date", from),
    db.from("events").select("id, name, date, compensated_at, created_at").eq("user_id", p.id).gte("date", from),
    db.from("body_checks").select("date, created_at").eq("user_id", p.id).order("date"),
  ]);
  const records = new Map(((fasts.data ?? []) as (FastDay & Row)[]).map((r) => [r.date, r]));
  const since = sinceDate(p, records);
  const weeks = weekSummaries({
    now,
    cfg: p,
    since,
    records,
    workouts: workouts.data ?? [],
    events: events.data ?? [],
    goals: profileGoals(p),
    weeks: WEEKS,
  });
  const graded = levelHistory(weeks, firstGradedWeek(since)).graded;
  const lastWeek = shiftDate(weekStart(today), -7);
  const last = graded.at(-1)?.weekStart === lastWeek ? graded.at(-1)! : null;
  const prev = last && graded.at(-2)?.weekStart === shiftDate(lastWeek, -7) ? graded.at(-2)! : null;

  let lastActivity: string | null = null;
  for (const list of [fasts.data, workouts.data, events.data, checks.data] as (Row[] | null)[])
    for (const r of list ?? []) {
      const t = r.updated_at ?? r.created_at ?? null;
      if (t && (!lastActivity || t > lastActivity)) lastActivity = t;
    }

  return {
    today,
    records,
    weeks,
    last,
    prev,
    lastActivity,
    events: (events.data ?? []) as { id: string; name: string; date: string; compensated_at: string | null }[],
    checks: (checks.data ?? []) as { date: string }[],
    fastStreak: fastStreaks(now, p, records, since).current,
    strengthRun: strengthWeekStreaks(weeks).current,
  };
}

/** ¿Es el rato de algún aviso del Club? (lunes nivel y podio, domingo cierre). Ahí se arma el ranking. */
function isClubWindow(now: Date, tz: string) {
  const day = isoDay(localDate(now, tz));
  const [h, m] = formatInTimeZone(now, tz, "HH:mm").split(":").map(Number);
  const near = (hhmm: string) => {
    const [lh, lm] = hhmm.split(":").map(Number);
    const diff = h * 60 + m - (lh * 60 + lm);
    return diff >= 0 && diff < 30;
  };
  return (day === 1 && (near(LEVEL_AT) || near(PODIUM_AT))) || (day === 7 && near(CLOSING_AT));
}

/**
 * Lo llama Supabase (pg_cron + pg_net) cada 15 minutos.
 * Decide qué avisos tocan para cada usuaria y los manda por Web Push.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  if (!isPushConfigured()) return NextResponse.json({ error: "faltan claves VAPID" }, { status: 500 });

  const db = createAdminClient();
  const [{ data: profiles, error }, { data: allSubs }, coachPrefs] = await Promise.all([
    db.from("profiles").select("*").neq("role", "disabled"),
    db.from("push_subscriptions").select("user_id, endpoint, p256dh, auth"),
    getCoachPrefs(db),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const subsOf = new Map<string, Subscription[]>();
  for (const s of allSubs ?? []) subsOf.set(s.user_id, [...(subsOf.get(s.user_id) ?? []), s]);

  // Se cargan los datos de quien tiene avisos.
  const list = (profiles ?? []) as Profile[];
  const loaded = new Map<string, Awaited<ReturnType<typeof loadUser>>>();
  await Promise.all(list.filter((p) => subsOf.has(p.id)).map(async (p) => loaded.set(p.id, await loadUser(db, p, now))));

  // En el rato de los avisos del Club: ranking de la semana cerrada y en vivo (mismo cálculo que la pestaña Club).
  let club: ClubMember[] = [];
  if (isClubWindow(now, "America/Argentina/Tucuman")) {
    const members = await clubMembers(db);
    club = await Promise.all(
      members.map(async (p) => ({ id: p.id, name: p.club_name!, avatar: null, isMe: false, ...(await clubStanding(db, p, now)) })),
    );
  }
  const closedRank = closedRanking(club);
  const liveRank = liveRanking(club);

  const report: Record<string, string[]> = {};
  for (const p of list) {
    const subs = subsOf.get(p.id);
    const u = loaded.get(p.id);
    if (!subs?.length || !u) continue;

    const { data: log } = await db
      .from("notification_log")
      .select("kind, ref, phrase_id, sent_at")
      .eq("user_id", p.id)
      .gte("sent_at", new Date(now.getTime() - 15 * 86_400_000).toISOString())
      .order("sent_at");
    const sentLog = (log ?? []) as { kind: NotifyKind; ref: string; phrase_id: number | null }[];
    const sent = new Set(sentLog.map((l) => `${l.kind}|${l.ref}`));
    const current = weekGoals(u.weeks.at(-1)!);
    const fasting = p.fasting_enabled !== false;
    const rank = closedRank.findIndex((r) => r.id === p.id);
    const liveIdx = liveRank.findIndex((r) => r.id === p.id);

    const due = [
      ...dueNotifications({
        now,
        cfg: p,
        prefs: (p.notify_prefs ?? {}) as Partial<Record<NotifyKind, boolean>>,
        fastRecords: u.records,
        goals: current,
        fasting,
        events: u.events.filter((e) => e.date >= shiftDate(u.today, -8) && e.date <= shiftDate(u.today, 1)),
        bodyNextDate: nextCheckDate(u.checks, p.body_check_start, u.today),
        bodyDoneToday: u.checks.some((c) => c.date === u.today),
        weekSummary: summaryText(u.weeks.at(-1)!),
        sent,
      }),
      ...coachNotifications({
        now,
        tz: p.timezone,
        enabled: coachPrefs,
        sent,
        fasting,
        last: u.last,
        prev: u.prev,
        club: rank >= 0 ? { pos: rank + 1, total: closedRank.length, winner: closedRank[0].name } : null,
        clubLive:
          liveIdx >= 0
            ? {
                pos: liveIdx + 1,
                total: liveRank.length,
                above: liveIdx > 0 ? { name: liveRank[liveIdx - 1].name, gap: liveRank[liveIdx - 1].live.score - liveRank[liveIdx].live.score } : null,
              }
            : null,
        current,
        fastStreak: u.fastStreak,
        strengthRun: u.strengthRun,
        lastActivity: u.lastActivity,
        createdDate: localDate(new Date(p.created_at), p.timezone),
      }),
    ];

    report[p.id] = [];
    for (const n of due) {
      const last = [...sentLog].reverse().find((l) => l.kind === n.kind)?.phrase_id ?? null;
      const msg = buildMessage(n.kind, n.vars, p.nicknames, last);
      // Registrar primero: si dos ejecuciones se pisan, la segunda choca con el unique y no repite.
      const { error: logErr } = await db
        .from("notification_log")
        .insert({ user_id: p.id, kind: n.kind, ref: n.ref, phrase_id: msg.phraseId });
      if (logErr) continue;
      const { expired } = await sendPush(subs, { title: "Ringo", body: msg.body, url: n.url ?? URLS[n.kind], tag: n.kind });
      if (expired.length) await db.from("push_subscriptions").delete().in("endpoint", expired);
      report[p.id].push(n.kind);
    }
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), sent: report });
}

export const GET = POST;
