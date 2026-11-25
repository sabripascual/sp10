import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfigured, sendPush } from "@/lib/push";
import { dayMark, localDate, shiftDate, type FastDay } from "@/lib/fast";
import { nextCheckDate } from "@/lib/body";
import { weekDates } from "@/lib/week";
import { dueNotifications } from "@/lib/notify-rules";
import { buildMessage, URLS, type NotifyKind } from "@/lib/phrases";
import { goalProgress, goalsText, profileGoals } from "@/lib/goals";

export const dynamic = "force-dynamic";

/**
 * Lo llama Supabase (pg_cron + pg_net) cada 15 minutos.
 * Decide qué avisos tocan para la dueña y los manda por Web Push.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  if (!isPushConfigured()) return NextResponse.json({ error: "faltan claves VAPID" }, { status: 500 });

  const db = createAdminClient();
  const { data: profiles, error } = await db.from("profiles").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const report: Record<string, string[]> = {};

  for (const p of profiles ?? []) {
    const userId = p.id as string;
    const tz = p.timezone as string;
    const today = localDate(now, tz);
    const week = weekDates(today);

    const [subs, fasts, workouts, events, checks, log] = await Promise.all([
      db.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId),
      db.from("fast_days").select("date, status, broken_at, extra_hours, event_id, started_at, ended_at").eq("user_id", userId).gte("date", week[0] < shiftDate(today, -2) ? week[0] : shiftDate(today, -2)),
      db.from("workouts").select("date, type, minutes, status").eq("user_id", userId).gte("date", week[0]).lte("date", week[6]),
      db.from("events").select("id, name, date, compensated_at").eq("user_id", userId).gte("date", shiftDate(today, -8)).lte("date", shiftDate(today, 1)),
      db.from("body_checks").select("date").eq("user_id", userId).order("date"),
      db.from("notification_log").select("kind, ref, phrase_id, sent_at").eq("user_id", userId).gte("sent_at", new Date(now.getTime() - 15 * 86_400_000).toISOString()).order("sent_at"),
    ]);
    if (!subs.data?.length) continue;

    const records = new Map(((fasts.data ?? []) as FastDay[]).map((r) => [r.date, r]));
    const ws = (workouts.data ?? []) as { date: string; type: string; minutes: number | null; status: string }[];
    const done = ws.filter((w) => w.status === "done");
    const checkDates = (checks.data ?? []) as { date: string }[];

    // Avance de la semana ideal (ayunos ya terminados + entrenos por tipo)
    const created = localDate(new Date(p.created_at as string), tz);
    const elapsed = week.filter((d) => d < today);
    const fastOk = elapsed.filter((d) => ["ok", "extended", "event"].includes(dayMark(d, now, p, records, created))).length;
    const byType: Record<string, number> = {};
    for (const w of done) byType[w.type] = (byType[w.type] ?? 0) + 1;
    const goals = goalProgress(profileGoals(p), { fastOk, byType });

    // Resumen de la semana (para el domingo)
    const compensated = (events.data ?? []).filter((e) => e.compensated_at && e.date >= week[0]).length;
    const runMin = done.filter((w) => w.type === "correr").reduce((a, w) => a + (w.minutes ?? 0), 0);
    const parts = [`${goals.pct}% de tu semana`, goalsText(goals.items)];
    if (compensated) parts.push(`${compensated} ${compensated === 1 ? "derrape compensado" : "derrapes compensados"}`);
    if (runMin) parts.push(`${runMin} min corridos`);

    const sentLog = (log.data ?? []) as { kind: NotifyKind; ref: string; phrase_id: number | null }[];
    const due = dueNotifications({
      now,
      cfg: p,
      prefs: (p.notify_prefs ?? {}) as Partial<Record<NotifyKind, boolean>>,
      fastRecords: records,
      goals,
      fasting: p.fasting_enabled !== false,
      events: events.data ?? [],
      bodyNextDate: nextCheckDate(checkDates, p.body_check_start, today),
      bodyDoneToday: checkDates.some((c) => c.date === today),
      weekSummary: parts.join(", "),
      sent: new Set(sentLog.map((l) => `${l.kind}|${l.ref}`)),
    });

    report[userId] = [];
    for (const n of due) {
      const last = [...sentLog].reverse().find((l) => l.kind === n.kind)?.phrase_id ?? null;
      const msg = buildMessage(n.kind, n.vars, p.nicknames as string[], last);
      // Registrar primero: si dos ejecuciones se pisan, la segunda choca con el unique y no repite.
      const { error: logErr } = await db
        .from("notification_log")
        .insert({ user_id: userId, kind: n.kind, ref: n.ref, phrase_id: msg.phraseId });
      if (logErr) continue;
      const { expired } = await sendPush(subs.data, { title: "Ringo", body: msg.body, url: URLS[n.kind], tag: n.kind });
      if (expired.length) await db.from("push_subscriptions").delete().in("endpoint", expired);
      report[userId].push(n.kind);
    }
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), sent: report });
}

export const GET = POST;
