"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { closeOutcome, extraHoursFor, fastWindow, getFastState, misfiledStart, resolveFastTimes, localDate, shiftDate, startDateFor, MAX_EXTRA_HOURS } from "@/lib/fast";
import { EDITABLE_DAYS, loadFastRecords } from "@/lib/fast-data";

export type FastActionResult = { error?: string };

async function current() {
  const profile = await getProfile();
  const now = new Date();
  const today = localDate(now, profile.timezone);
  const records = await loadFastRecords(profile, shiftDate(today, -2));
  return { profile, now, records, state: getFastState(now, profile, records) };
}

function done() {
  revalidatePath("/", "layout");
  return {};
}

/** "Empezar": arranca el próximo ayuno ahora mismo. */
export async function startFast(): Promise<FastActionResult> {
  const { profile, now, records, state } = await current();
  if (state.phase === "fasting") return { error: "Ya estás ayunando." };
  if (state.phase === "overtime") return { error: "Primero contame a qué hora terminaste el ayuno anterior." };
  const date = startDateFor(now, profile, records, state.next.date);
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    { date, status: "ok", started_at: now.toISOString(), ended_at: null, broken_at: null, extra_hours: 0 },
    { onConflict: "user_id,date" },
  );
  return error ? { error: error.message } : done();
}

/**
 * "Terminar": cierra el ayuno en curso (o el que espera confirmación) ahora o a la hora
 * que digas ("HH:MM", hoy o anoche). Queda cumplido, extendido o cortado según las horas reales.
 */
export async function endFast(atHHMM?: string): Promise<FastActionResult & { status?: string; hours?: number }> {
  const { profile, now, state } = await current();
  if (state.phase !== "fasting" && state.phase !== "overtime") return { error: "No hay un ayuno en curso." };
  const w = state.window;

  let endAt = now;
  if (atHHMM) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(atHHMM)) return { error: "Hora inválida." };
    const today = localDate(now, profile.timezone);
    endAt = fromZonedTime(`${today}T${atHHMM}:00`, profile.timezone);
    if (endAt > now) endAt = fromZonedTime(`${shiftDate(today, -1)}T${atHHMM}:00`, profile.timezone);
    if (endAt <= w.start) return { error: "Esa hora es anterior al inicio del ayuno." };
  }
  const outcome = closeOutcome(w.start, endAt, profile);
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    {
      date: w.date,
      status: w.record?.status === "event" ? "event" : outcome.status,
      extra_hours: outcome.extra_hours,
      started_at: w.record?.started_at ?? null,
      ended_at: endAt.toISOString(),
      broken_at: outcome.status === "broken" ? endAt.toISOString() : null,
    },
    { onConflict: "user_id,date" },
  );
  const hours = Math.round(((endAt.getTime() - w.start.getTime()) / 3_600_000) * 10) / 10;
  return error ? { error: error.message } : { ...done(), status: outcome.status, hours };
}

export async function extendFast(hours: number): Promise<FastActionResult> {
  if (hours !== 1 && hours !== 2) return { error: "Solo +1 h o +2 h." };
  const { profile, now, state } = await current();
  const target =
    state.phase === "fasting" || state.phase === "overtime"
      ? state.window
      : state.phase === "eating" && state.canExtend
        ? state.previous
        : null;
  if (!target) return { error: "Este ayuno ya no se puede extender." };

  // En curso: suma horas al fin. Si ya pasó el fin ("¿terminaste?"), el nuevo fin queda a +N h desde ahora.
  const extra =
    state.phase === "overtime"
      ? extraHoursFor(target, now, hours, profile)
      : Math.min((target.record?.extra_hours ?? 0) + hours, MAX_EXTRA_HOURS);
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
        ? // "No lo hice": queda cortado con 0 h
          { status: "broken", broken_at: fastWindow(date, profile, null).start.toISOString(), ended_at: null, started_at: null }
        : { status: "extended", extra_hours: choice === "extend1" ? 1 : 2, broken_at: null, ended_at: null };

  const { error } = await supabase
    .from("fast_days")
    .upsert({ date, ...row }, { onConflict: "user_id,date" });
  return error ? { error: error.message } : done();
}

/**
 * "Empecé a las…": corrige la hora real de inicio del ayuno en curso
 * (o del próximo, si lo empezaste antes de tiempo). El fin se recalcula solo.
 */
export async function adjustStart(hhmm: string): Promise<FastActionResult> {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) return { error: "Hora inválida." };
  const { profile, now, records, state } = await current();
  const today = localDate(now, profile.timezone);

  let startAt = fromZonedTime(`${today}T${hhmm}:00`, profile.timezone);
  if (startAt > now) startAt = fromZonedTime(`${shiftDate(today, -1)}T${hhmm}:00`, profile.timezone);
  if (now.getTime() - startAt.getTime() > 23 * 3_600_000) return { error: "Esa hora es muy vieja para este ayuno." };

  const target = state.phase === "eating" ? state.next : state.window;
  const previous = state.phase === "eating" ? state.previous : null;
  if (previous && startAt < previous.end) return { error: "Esa hora se pisa con el ayuno anterior." };
  // En la ventana abierta, el ayuno es el de la noche en que arrancó (no siempre el próximo del horario)
  const date = state.phase === "eating" ? startDateFor(startAt, profile, records, target.date) : target.date;

  const supabase = await createClient();
  const { error } = await supabase
    .from("fast_days")
    .upsert({ date, started_at: startAt.toISOString(), ended_at: null, broken_at: null }, { onConflict: "user_id,date" });
  return error ? { error: error.message } : done();
}

/**
 * "Recién arranco": el ayuno empieza AHORA (aunque el horario diga que arrancó antes)
 * y, si querés, el ayuno anterior queda como perdido (cortado, 0 h).
 */
export async function restartFast(markPreviousLost: boolean): Promise<FastActionResult> {
  const { profile, now, records, state } = await current();
  const date = state.phase === "eating" ? startDateFor(now, profile, records, state.next.date) : state.window.date;
  const target = fastWindow(date, profile, records.get(date) ?? null);
  const prevDate = state.phase === "eating" ? state.previous.date : shiftDate(target.date, -1);
  const supabase = await createClient();

  const { error } = await supabase.from("fast_days").upsert(
    {
      date: target.date,
      status: target.record?.status === "event" ? "event" : "ok",
      started_at: now.toISOString(),
      ended_at: null,
      broken_at: null,
      extra_hours: target.record?.status === "event" ? (target.record?.extra_hours ?? 0) : 0,
    },
    { onConflict: "user_id,date" },
  );
  if (error) return { error: error.message };

  // si arranca de nuevo el de esta noche (que estaba cortado), no hay otro anterior que marcar
  if (markPreviousLost && prevDate !== target.date) {
    const prev = fastWindow(prevDate, profile, records.get(prevDate) ?? null);
    const { error: prevError } = await supabase.from("fast_days").upsert(
      { date: prevDate, status: "broken", ended_at: null, broken_at: prev.start.toISOString() },
      { onConflict: "user_id,date" },
    );
    if (prevError) return { error: prevError.message };
  }
  return done();
}

/** Horas reales de un ayuno que ya pasó (inicio y fin): queda cumplido, extendido o cortado según las horas. */
export async function setFastTimes(date: string, startHHMM: string, endHHMM: string): Promise<FastActionResult> {
  const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !HHMM.test(startHHMM) || !HHMM.test(endHHMM))
    return { error: "Revisá las horas." };
  const profile = await getProfile();
  const now = new Date();
  const today = localDate(now, profile.timezone);
  if (date < shiftDate(today, -EDITABLE_DAYS)) return { error: "Ese día es muy viejo para editarlo." };

  const records = await loadFastRecords(profile, shiftDate(date, -1));
  let record = records.get(date) ?? null;
  let { start, end } = resolveFastTimes(date, startHHMM, endHHMM, profile.timezone);
  // Ayuno guardado con la fecha de la noche siguiente: se pasa a la noche en que arrancó.
  const misfiled = misfiledStart(date, record, profile.timezone);
  const saveDate = misfiled ? shiftDate(date, -1) : date;
  if (misfiled) ({ start, end } = resolveFastTimes(saveDate, startHHMM, endHHMM, profile.timezone));
  if (end > now) return { error: `Las ${endHHMM} de ese día todavía no llegaron. Revisá las horas.` };
  if (end.getTime() - start.getTime() > 36 * 3_600_000) return { error: "Más de 36 h: revisá las horas." };
  if (misfiled && records.get(saveDate)?.status === "event") record = { ...record!, status: "event" };
  const outcome = closeOutcome(start, end, profile);
  const supabase = await createClient();
  const { error } = await supabase.from("fast_days").upsert(
    {
      date: saveDate,
      status: record?.status === "event" ? "event" : outcome.status,
      extra_hours: outcome.extra_hours,
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      broken_at: outcome.status === "broken" ? end.toISOString() : null,
    },
    { onConflict: "user_id,date" },
  );
  if (error) return { error: error.message };
  if (misfiled) {
    const { error: delError } = await supabase.from("fast_days").delete().eq("date", date);
    if (delError) return { error: delError.message };
  }
  return done();
}
