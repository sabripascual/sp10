"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { localDate, shiftDate } from "@/lib/fast";
import type { Compensation, EventKind } from "@/lib/events";
import { ZONES, type Feeling, type WorkoutDetails, type WorkoutType, type Zone } from "@/lib/training-types";

export type ActionResult = { error?: string; ok?: boolean };

const TYPES: WorkoutType[] = ["fuerza", "correr", "futbol", "padel", "otro"];
const FEELINGS: Feeling[] = ["dificil", "bien", "excelente"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

async function today() {
  const profile = await getProfile();
  return localDate(new Date(), profile.timezone);
}

async function validDate(date: string) {
  if (!DATE_RE.test(date)) return "Fecha inválida.";
  const t = await today();
  if (date > t) return "Todavía no llegó ese día.";
  if (date < shiftDate(t, -60)) return "Ese día es muy viejo.";
  return null;
}

export async function addWorkout(input: {
  date: string;
  type: WorkoutType;
  minutes?: number | null;
  feeling?: Feeling | null;
  note?: string | null;
  details?: WorkoutDetails;
}): Promise<ActionResult> {
  const dateError = await validDate(input.date);
  if (dateError) return { error: dateError };
  if (!TYPES.includes(input.type)) return { error: "Tipo inválido." };
  const minutes = input.minutes ? Math.round(input.minutes) : null;
  if (minutes !== null && (minutes < 1 || minutes > 600)) return { error: "Revisá los minutos." };
  if (input.feeling && !FEELINGS.includes(input.feeling)) return { error: "Sensación inválida." };

  // Detalle: zonas solo para fierritos, kcal solo para carrera (números chicos y enteros)
  const details: WorkoutDetails = {};
  if (input.type === "fuerza" && input.details?.zones) {
    const zones: WorkoutDetails["zones"] = {};
    for (const { key } of ZONES) {
      const z = input.details.zones[key as Zone];
      if (!z) continue;
      const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
      zones[key] = { exercises: clamp(z.exercises, 30), reps: clamp(z.reps, 200), rounds: clamp(z.rounds, 30) };
    }
    if (Object.keys(zones).length) details.zones = zones;
  }
  if (input.type === "correr" && input.details?.kcal) details.kcal = Math.max(0, Math.min(5000, Math.round(input.details.kcal)));

  const supabase = await createClient();
  const { error } = await supabase.from("workouts").insert({
    date: input.date,
    type: input.type,
    minutes,
    feeling: null,
    note: input.type === "correr" ? null : input.note?.trim().slice(0, 280) || null,
    source: "manual",
    details,
  });
  return error ? { error: error.message } : done();
}

export async function deleteWorkout(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  return error ? { error: error.message } : done();
}

export async function createEvent(input: {
  name: string;
  date: string;
  kind: EventKind;
  compensation: Compensation;
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { error: "Ponele un nombre al evento." };
  if (!DATE_RE.test(input.date)) return { error: "Fecha inválida." };
  if (input.date < (await today())) return { error: "El evento tiene que ser hoy o más adelante." };
  if (!["cena", "tragos", "ambos"].includes(input.kind)) return { error: "Tipo inválido." };
  if (!["fast", "workout", "both"].includes(input.compensation)) return { error: "Compensación inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ name: name.slice(0, 80), date: input.date, kind: input.kind, compensation: input.compensation })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // El ayuno de esa noche queda como "evento" (no corta la racha);
  // si se compensa con ayuno, la primera comida del día siguiente se corre +2 h.
  const { error: fastError } = await supabase.from("fast_days").upsert(
    {
      date: input.date,
      status: "event",
      event_id: data.id,
      ...(input.compensation !== "workout" ? { extra_hours: 2 } : {}),
    },
    { onConflict: "user_id,date" },
  );
  return fastError ? { error: fastError.message } : done();
}

export async function compensateEvent(id: string, undo = false): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ compensated_at: undo ? null : new Date().toISOString() })
    .eq("id", id);
  return error ? { error: error.message } : done();
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: fast } = await supabase
    .from("fast_days")
    .select("date, ended_at, started_at")
    .eq("event_id", id)
    .maybeSingle();
  if (fast) {
    // Si no se tocó a mano, el día vuelve al horario normal.
    const { error } =
      fast.ended_at || fast.started_at
        ? await supabase.from("fast_days").update({ event_id: null, status: "ok", extra_hours: 0 }).eq("date", fast.date)
        : await supabase.from("fast_days").delete().eq("date", fast.date);
    if (error) return { error: error.message };
  }
  const { error } = await supabase.from("events").delete().eq("id", id);
  return error ? { error: error.message } : done();
}
