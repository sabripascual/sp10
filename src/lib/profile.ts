import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  role: "admin" | "user" | "disabled";
  nicknames: string[];
  fast_start: string; // "HH:MM:SS"
  fast_end: string;
  strength_goal: number;
  hide_weight: boolean;
  timezone: string;
  week_template: Record<string, string>;
  created_at: string;
  body_check_start: string | null;
  notify_prefs: Record<string, boolean> | null;
  favorite_sports: string[] | null;
  weekly_goals: Record<string, number> | null;
  club_visible?: boolean;
  club_name?: string | null;
  avatar_path?: string | null;
};

export const DEFAULT_NICKNAMES = ["crack", "reina", "bebita", "diosa", "amorrrr"];

/** Devuelve el perfil de la usuaria logueada (lo crea si todavía no existe). */
export const getProfile = cache(async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`No pude leer el perfil: ${error.message}`);
  if (data) {
    // Cuenta pausada desde el panel admin
    if (data.role === "disabled") redirect("/restringido");
    return data as Profile;
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .single();
  if (insertError) throw new Error(`No pude crear el perfil: ${insertError.message}`);
  return created as Profile;
});

export function randomNickname(nicknames: string[]) {
  const list = nicknames.length ? nicknames : DEFAULT_NICKNAMES;
  return list[Math.floor(Math.random() * list.length)];
}
