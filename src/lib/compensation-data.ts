import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/profile";
import { localDate, shiftDate, type FastDay } from "@/lib/fast";
import { compensationCheck, compFastDone, eventPhase, type SocialEvent } from "@/lib/events";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Compensación automática: marca compensados los derrapes que ya cumplieron lo que pedían
 * (el entreno de ese deporte con esos minutos y/o el ayuno con las horas extra).
 * Devuelve los nombres de los que se acaban de compensar.
 */
export async function autoCompensate(supabase: Supabase, profile: Profile): Promise<string[]> {
  const now = new Date();
  const today = localDate(now, profile.timezone);
  const { data: evData } = await supabase
    .from("events")
    .select("id, name, date, kind, compensation, compensated_at, comp_detail, compensated_by")
    .gte("date", shiftDate(today, -9))
    .lt("date", today);
  const all = (evData ?? []) as SocialEvent[];
  const pending = all.filter((e) => !e.compensated_at && eventPhase(e, today) === "compensate");
  if (!pending.length) return [];

  const from = pending.reduce((a, e) => (e.date < a ? e.date : a), today);
  const [{ data: wData }, { data: fData }] = await Promise.all([
    supabase.from("workouts").select("id, date, type, minutes, status").gt("date", from).order("created_at"),
    supabase
      .from("fast_days")
      .select("date, status, broken_at, extra_hours, event_id, started_at, ended_at")
      .in("date", pending.map((e) => e.date)),
  ]);
  const workouts = wData ?? [];
  const fasts = new Map(((fData ?? []) as FastDay[]).map((r) => [r.date, r]));
  const used = new Set(all.map((e) => e.compensated_by).filter(Boolean) as string[]);

  const done: string[] = [];
  for (const ev of pending.sort((a, b) => a.date.localeCompare(b.date))) {
    const fastDone = compFastDone(ev.date, profile, fasts.get(ev.date) ?? null, ev.comp_detail?.fastHours ?? 2, now);
    const c = compensationCheck(ev, workouts, fastDone, used);
    if (!c.complete) continue;
    const { error } = await supabase
      .from("events")
      .update({ compensated_at: now.toISOString(), compensated_by: c.workout?.id ?? null })
      .eq("id", ev.id)
      .is("compensated_at", null);
    if (error) continue;
    if (c.workout) used.add(c.workout.id);
    done.push(ev.name);
  }
  return done;
}
