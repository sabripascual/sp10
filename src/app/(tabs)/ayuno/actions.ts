"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { closeOutcome, fastWindow, getFastState, localDate, shiftDate, MAX_EXTRA_HOURS } from "@/lib/fast";
import { EDITABLE_DAYS, loadFastRecords } from "@/lib/fast-data";

export type FastActionResult = { error?: string };

async function current() {
  const profile = await getProfile();
  const now = new Date();
  const today = localDate(now, profile.timezone);
  const records = await loadFastRecords(profile, shiftDate(today, -2));
  return { profile, now, state: getFastState(now, profile, records) };
}

function done() {
  revalidatePath("/", "layout");
  return {};
}

/** "Empezar": arranca el próximo ayuno ahora mismo. */
export async function startFast(): Promise<FastActionResult> {
  const { now, state } = await current();
  if (state.phase !== "eating") return { error: "Ya estás ayunando." };
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    { date: state.next.date, status: "ok", started_at: now.toISOString(), ended_at: null, broken_at: null, extra_hours: 0 },
    { onConflict: "user_id,date" },
  );
  return error ? { error: error.message } : done();
}

/** "Terminar": cierra el ayuno en curso ahora. Cumplido, extendido o cortado según las horas. */
export async function endFast(): Promise<FastActionResult & { status?: string }> {
  const { profile, now, state } = await current();
  if (state.phase !== "fasting") return { error: "No hay un ayuno en curso." };
  const w = state.window;
  const outcome = closeOutcome(w.start, now, profile);
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    {
      date: w.date,
      status: w.record?.status === "event" ? "event" : outcome.status,
      extra_hours: outcome.extra_hours,
      started_at: w.record?.started_at ?? null,
      ended_at: now.toISOString(),
      broken_at: outcome.status === "broken" ? now.toISOString() : null,
    },
    { onConflict: "user_id,date" },
  );
  return error ? { error: error.message } : { ...done(), status: outcome.status };
}

export async function extendFast(hours: number): Promise<FastActionResult> {
  if (hours !== 1 && hours !== 2) return { error: "Solo +1 h o +2 h." };
  const { state } = await current();
  const target =
    state.phase === "fasting" ? state.window : state.phase === "eating" && state.canExtend ? state.previous : null;
  if (!target) return { error: "Este ayuno ya no se puede extender." };

  const extra = Math.min((target.record?.extra_hours ?? 0) + hours, MAX_EXTRA_HOURS);
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    {
      date: target.date,
      status: target.record?.status === "event" ? "event" : "extended",
      extra_hours: extra,
    },
    { onConflict: "user_id,date" },
  );
  return error ? { error: error.message } : done();
}

/** "Seguir ayunando": deshace un "Terminar" tocado hace poco. */
export async function resumeFast(): Promise<FastActionResult> {
  const { state } = await current();
  if (state.phase !== "eating" || !state.canResume) return { error: "No hay nada para deshacer." };
  const r = state.previous.record!;
  const supabase = await createClient();
  const { error } = await supabase
    .from("fast_days")
    .update({ ended_at: null, broken_at: null, status: r.event_id ? "event" : "ok", extra_hours: 0 })
    .eq("date", r.date);
  return error ? { error: error.message } : done();
}

export type DayChoice = "ok" | "extend1" | "extend2" | "broken" | "clear";

/** Cargar o corregir un ayuno que ya terminó, tocando el día en el calendario. */
export async function setFastDay(date: string, choice: DayChoice): Promise<FastActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Fecha inválida." };
  const profile = await getProfile();
  const now = new Date();
  const today = localDate(now, profile.timezone);
  if (date < shiftDate(today, -EDITABLE_DAYS)) return { error: "Ese día es muy viejo para editarlo." };

  const records = await loadFastRecords(profile, date);
  const record = records.get(date) ?? null;
  if (fastWindow(date, profile, record).end > now || fastWindow(date, profile, null).end > now)
    return { error: "Ese ayuno todavía no terminó: usá los botones de arriba." };

  const supabase = await createClient();
  if (choice === "clear") {
    const { error } = await supabase.from("fast_days").delete().eq("date", date);
    return error ? { error: error.message } : done();
  }

  const row =
    choice === "ok"
      ? { status: "ok", extra_hours: 0, broken_at: null, ended_at: null }
      : choice === "broken"
        ? { status: "broken", broken_at: null, ended_at: null }
        : { status: "extended", extra_hours: choice === "extend1" ? 1 : 2, broken_at: null, ended_at: null };

  const { error } = await supabase
    .from("fast_days")
    .upsert({ date, ...row }, { onConflict: "user_id,date" });
  return error ? { error: error.message } : done();
}
