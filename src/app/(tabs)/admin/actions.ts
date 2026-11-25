"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-data";
import { getCoachPrefs } from "@/lib/app-settings";
import { isPushConfigured, sendPush } from "@/lib/push";
import { COACH_KINDS, URLS, buildMessage, type CoachKind } from "@/lib/phrases";

export type AdminResult = { error?: string; ok?: string };

/** Crea una cuenta nueva (ya confirmada) con contraseña inicial. */
export async function createAccount(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "user";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Revisá el email." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { error: error.message.includes("already") ? "Ya hay una cuenta con ese email." : error.message };

  // El trigger crea el perfil como 'user'; si es admin, lo subimos
  const { error: pErr } = await db.from("profiles").upsert({ id: data.user.id, role }, { onConflict: "id" });
  if (pErr) return { error: pErr.message };
  revalidatePath("/admin");
  return { ok: `Listo: ${email} ya puede entrar a Ringo.` };
}

/** Pausar / reactivar / hacer admin. No te podés sacar el admin ni pausar a vos misma. */
export async function setRole(userId: string, role: "admin" | "user" | "disabled"): Promise<AdminResult> {
  const me = await requireAdmin();
  if (userId === me.id) return { error: "No podés cambiar tu propio rol." };
  if (!["admin", "user", "disabled"].includes(role)) return { error: "Rol inválido." };
  const db = createAdminClient();
  const { error } = await db.from("profiles").upsert({ id: userId, role }, { onConflict: "id" });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: "Rol actualizado." };
}

/** Pone una contraseña nueva a una cuenta (para cuando una amiga se la olvida). */
export async function resetPassword(userId: string, password: string): Promise<AdminResult> {
  await requireAdmin();
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  const db = createAdminClient();
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  return error ? { error: error.message } : { ok: "Contraseña cambiada." };
}

/** Prender/apagar un aviso del coach para todas. */
export async function setCoachPref(kind: CoachKind, on: boolean): Promise<AdminResult> {
  await requireAdmin();
  if (!COACH_KINDS.some((k) => k.kind === kind)) return { error: "Aviso inválido." };
  const db = createAdminClient();
  const prefs = await getCoachPrefs(db);
  const { error } = await db
    .from("app_settings")
    .upsert({ key: "coach_notify", value: { ...prefs, [kind]: on }, updated_at: new Date().toISOString() });
  if (error) return { error: error.message.includes("app_settings") ? "Falta correr la migración 0016." : error.message };
  revalidatePath("/admin");
  return { ok: on ? "Prendido para todas." : "Apagado para todas." };
}

/** Manda un ejemplo de ese aviso a tus dispositivos. */
export async function testCoach(kind: CoachKind): Promise<AdminResult> {
  const me = await requireAdmin();
  if (!isPushConfigured()) return { error: "Faltan las claves VAPID." };
  const db = createAdminClient();
  const { data: subs } = await db.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", me.id);
  if (!subs?.length) return { error: "Activá los avisos en este celu primero (Ajustes → Avisos)." };
  const sample: Record<CoachKind, Record<string, string>> = {
    level_result: { emoji: "⚡", nivel: "perrita crack", cambio: "Subiste de escalón, esaaa 📈 ", puesto: " y quedaste 2ª de 5 en el Club" },
    club_podium: { linea: "🏆 Cerró el ranking, {apodo}: ganó Juli 👑 y vos quedaste 2ª. Entrá a ver el podio y los premios 🌶️🚀🛋️" },
    club_closing: { linea: "🚨 Últimas 3 horas del Ringo Club: vas 2ª y estás a 6 pts de Juli. ¿Un entrenito de último momento, {apodo}? 😏" },
    forecast: { linea: "Pronóstico Ringo: si seguís así, {apodo}, cerrás la semana perrita crack ⚡. Que no se te suba a la cabeza 😏" },
    streak_milestone: { linea: "🔥 ¡7 días de ayuno seguidos, {apodo}! Esto ya es un estilo de vida" },
    idle: {},
  };
  const msg = buildMessage(kind, sample[kind], me.nicknames, null);
  const { delivered, expired } = await sendPush(subs, { title: "Ringo · prueba", body: msg.body, url: URLS[kind] });
  if (expired.length) await db.from("push_subscriptions").delete().in("endpoint", expired);
  return delivered ? { ok: "Enviado a tu celu." } : { error: "No llegó a ningún dispositivo." };
}
