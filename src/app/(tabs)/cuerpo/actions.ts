"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { localDate } from "@/lib/fast";
import { MEASURES, type Angle, type Measure } from "@/lib/body";
import { photoPath } from "@/lib/body-data";

export type BodyResult = { error?: string; id?: string };

const ANGLES: Angle[] = ["front", "side", "back"];

function num(v: unknown, min: number, max: number) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) return undefined; // inválido
  return Math.round(n * 10) / 10;
}

/** Crea o actualiza el control de hoy (uno por día). */
export async function saveCheck(input: { weight?: string; measures?: Partial<Record<Measure, string>> }): Promise<BodyResult> {
  const profile = await getProfile();
  const today = localDate(new Date(), profile.timezone);

  const row: Record<string, number | null | string> = { date: today };
  if (input.weight !== undefined) {
    const w = num(input.weight, 20, 300);
    if (w === undefined) return { error: "Revisá el peso (en kg)." };
    row.weight_kg = w;
  }
  for (const { key, label } of MEASURES) {
    if (input.measures && key in input.measures) {
      const v = num(input.measures[key], 5, 250);
      if (v === undefined) return { error: `Revisá ${label.toLowerCase()} (en cm).` };
      row[key] = v;
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_checks")
    .upsert(row, { onConflict: "user_id,date" })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { id: data.id };
}

/** Registra una foto ya subida a Storage desde el navegador. */
export async function savePhoto(checkId: string, angle: Angle): Promise<BodyResult> {
  if (!ANGLES.includes(angle)) return { error: "Ángulo inválido." };
  const profile = await getProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("body_photos")
    .upsert(
      { check_id: checkId, angle, storage_path: photoPath(profile.id, checkId, angle) },
      { onConflict: "check_id,angle" },
    );
  if (error) return { error: error.message };
  revalidatePath("/cuerpo");
  return {};
}

export async function deleteCheck(checkId: string): Promise<BodyResult> {
  const profile = await getProfile();
  const supabase = await createClient();
  await supabase.storage.from("body-photos").remove(ANGLES.map((a) => photoPath(profile.id, checkId, a)));
  const { error } = await supabase.from("body_checks").delete().eq("id", checkId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
