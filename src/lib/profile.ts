import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  role: "admin";
  nicknames: string[];
  fast_start: string; // "HH:MM:SS"
  fast_end: string;
  strength_goal: number;
  hide_weight: boolean;
  timezone: string;
  week_template: Record<string, string>;
};

export const DEFAULT_NICKNAMES = ["crack", "reina", "bebita", "diosa", "amorrrr"];

/** Devuelve el perfil de la usuaria logueada (lo crea si todavía no existe). */
export async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`No pude leer el perfil: ${error.message}`);
  if (data) return data as Profile;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id })
    .select("*")
    .single();
  if (insertError) throw new Error(`No pude crear el perfil: ${insertError.message}`);
  return created as Profile;
}

export function randomNickname(nicknames: string[]) {
  const list = nicknames.length ? nicknames : DEFAULT_NICKNAMES;
  return list[Math.floor(Math.random() * list.length)];
}
