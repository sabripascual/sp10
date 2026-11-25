"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profile";
import { CLUB_MAX_MEMBERS } from "@/lib/club-data";

export type ClubResult = { ok?: string; error?: string; clubId?: string };

const MAX_OWNED = 5;

const cleanName = (raw: unknown, max: number) => String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Código de invitación al azar (8 letras/números, sin confusos). */
function newCode() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(8)), (n) => abc[n % abc.length]).join("");
}

async function ownerOf(clubId: string) {
  const db = createAdminClient();
  const { data } = await db.from("clubs").select("owner_id").eq("id", clubId).maybeSingle();
  return { db, ownerId: (data?.owner_id as string) ?? null };
}

function done(r: ClubResult): ClubResult {
  revalidatePath("/club");
  return r;
}

/** Crear un club: quien lo crea es la dueña. */
export async function createClub(name: string, myName: string): Promise<ClubResult> {
  const me = await getProfile();
  const club = cleanName(name, 40);
  const mine = cleanName(myName, 20);
  if (!club) return { error: "Ponele un nombre al club." };
  if (!mine) return { error: "Poné tu nombre en el club." };
  const db = createAdminClient();
  const { count } = await db.from("clubs").select("id", { count: "exact", head: true }).eq("owner_id", me.id);
  if ((count ?? 0) >= MAX_OWNED) return { error: `Podés tener hasta ${MAX_OWNED} clubes propios.` };
  const { data, error } = await db.from("clubs").insert({ name: club, owner_id: me.id, invite_code: newCode() }).select("id").single();
  if (error) return { error: error.message.includes("clubs") ? "Falta correr la migración 0021." : error.message };
  const { error: mErr } = await db.from("club_members").insert({ club_id: data.id, user_id: me.id, role: "owner", display_name: mine });
  if (mErr) {
    await db.from("clubs").delete().eq("id", data.id);
    return { error: mErr.message };
  }
  return done({ ok: "¡Club creado! Ahora invitá a tus amigas 🐶", clubId: data.id });
}

/** Sumarse con el código de invitación (tope de miembros). */
export async function joinClub(code: string, myName: string): Promise<ClubResult> {
  const me = await getProfile();
  const mine = cleanName(myName, 20);
  if (!mine) return { error: "Poné tu nombre en el club." };
  const db = createAdminClient();
  const { data: club } = await db.from("clubs").select("id, name").eq("invite_code", code.trim().toLowerCase()).maybeSingle();
  if (!club) return { error: "Ese link de invitación no anda. Pedíselo de nuevo a quien te invitó." };
  const { data: rows } = await db.from("club_members").select("user_id").eq("club_id", club.id);
  if ((rows ?? []).some((r) => r.user_id === me.id)) return done({ ok: "Ya estabas en este club 😉", clubId: club.id });
  if ((rows ?? []).length >= CLUB_MAX_MEMBERS) return { error: `El club está lleno (máximo ${CLUB_MAX_MEMBERS}).` };
  const { error } = await db.from("club_members").insert({ club_id: club.id, user_id: me.id, role: "member", display_name: mine });
  if (error) return { error: error.message };
  return done({ ok: `¡Bienvenida a ${club.name}! 🏆`, clubId: club.id });
}

/** Salir de un club. Si sos la dueña y quedan otras, la dueñez pasa a la más antigua; si no queda nadie, el club se borra. */
export async function leaveClub(clubId: string): Promise<ClubResult> {
  const me = await getProfile();
  const { db, ownerId } = await ownerOf(clubId);
  if (!ownerId) return { error: "Ese club no existe." };
  await db.from("club_members").delete().eq("club_id", clubId).eq("user_id", me.id);
  if (ownerId === me.id) {
    const { data: next } = await db.from("club_members").select("user_id").eq("club_id", clubId).order("joined_at").limit(1).maybeSingle();
    if (!next) await db.from("clubs").delete().eq("id", clubId);
    else
      await Promise.all([
        db.from("clubs").update({ owner_id: next.user_id }).eq("id", clubId),
        db.from("club_members").update({ role: "owner" }).eq("club_id", clubId).eq("user_id", next.user_id),
      ]);
  }
  return done({ ok: "Saliste del club." });
}

/** La dueña saca a alguien. */
export async function removeMember(clubId: string, userId: string): Promise<ClubResult> {
  const me = await getProfile();
  const { db, ownerId } = await ownerOf(clubId);
  if (ownerId !== me.id) return { error: "Solo la dueña del club puede sacar gente." };
  if (userId === me.id) return { error: "Para irte, usá “Salir del club”." };
  const { error } = await db.from("club_members").delete().eq("club_id", clubId).eq("user_id", userId);
  if (error) return { error: error.message };
  return done({ ok: "Listo, ya no está en el club." });
}

/** La dueña cambia el nombre del club. */
export async function renameClub(clubId: string, name: string): Promise<ClubResult> {
  const me = await getProfile();
  const club = cleanName(name, 40);
  if (!club) return { error: "Ponele un nombre al club." };
  const { db, ownerId } = await ownerOf(clubId);
  if (ownerId !== me.id) return { error: "Solo la dueña puede cambiar el nombre." };
  const { error } = await db.from("clubs").update({ name: club }).eq("id", clubId);
  if (error) return { error: error.message };
  return done({ ok: "Nombre cambiado." });
}

/** Cambiar mi nombre en un club. */
export async function renameMe(clubId: string, myName: string): Promise<ClubResult> {
  const me = await getProfile();
  const mine = cleanName(myName, 20);
  if (!mine) return { error: "Poné tu nombre en el club." };
  const db = createAdminClient();
  const { error } = await db.from("club_members").update({ display_name: mine }).eq("club_id", clubId).eq("user_id", me.id);
  if (error) return { error: error.message };
  return done({ ok: "Nombre cambiado." });
}
