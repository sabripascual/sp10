import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CoachKind } from "@/lib/phrases";

export type CoachPrefs = Partial<Record<CoachKind, boolean>>;

/** Qué avisos del coach están prendidos (lo que no figura = prendido). Si la tabla no existe todavía, todo prendido. */
export async function getCoachPrefs(db = createAdminClient()): Promise<CoachPrefs> {
  const { data } = await db.from("app_settings").select("value").eq("key", "coach_notify").maybeSingle();
  return (data?.value ?? {}) as CoachPrefs;
}
