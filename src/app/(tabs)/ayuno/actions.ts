"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { getFastState, localDate, shiftDate, MAX_EXTRA_HOURS } from "@/lib/fast";
import { loadFastRecords } from "@/lib/fast-data";

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

export async function breakFast(): Promise<FastActionResult> {
  const { now, state } = await current();
  if (state.phase !== "fasting") return { error: "No hay un ayuno en curso." };
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    {
      date: state.window.date,
      status: "broken",
      broken_at: now.toISOString(),
      extra_hours: state.window.record?.extra_hours ?? 0,
    },
    { onConflict: "user_id,date" },
  );
  return error ? { error: error.message } : done();
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

/** "Me equivoqué": deshace el "Lo rompí" del ayuno en curso. */
export async function undoBreak(): Promise<FastActionResult> {
  const { state } = await current();
  if (state.phase !== "broken") return { error: "No hay nada para deshacer." };
  const record = state.window.record!;
  const supabase = await createClient();
  const { error } =
    record.extra_hours > 0 || record.event_id
      ? await supabase
          .from("fast_days")
          .update({ status: record.event_id ? "event" : "extended", broken_at: null })
          .eq("date", record.date)
      : await supabase.from("fast_days").delete().eq("date", record.date);
  return error ? { error: error.message } : done();
}
