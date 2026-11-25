"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-data";
import { getCoachPrefs } from "@/lib/app-settings";
import { waLink } from "@/lib/whatsapp";
import { friendlyPassword } from "@/lib/admin-notify";
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
  if (error) return { error: error.message };
  await db.from("profiles").update({ must_change_password: true }).eq("id", userId);
  return { ok: "Contraseña cambiada. Al entrar le vamos a ofrecer elegir la suya." };
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

// ── Solicitudes de cuenta y pedidos de contraseña ─────────────────────────

const APP_URL = () => (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://sp10-flax.vercel.app");

/** Aprobar una cuenta que se registró sola. Devuelve el link de WhatsApp para avisarle. */
export async function approveAccount(userId: string): Promise<AdminResult & { wa?: string }> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("role, display_name, whatsapp").eq("id", userId).single();
  if (p?.role !== "pending") return { error: "Esa solicitud ya no está pendiente." };
  const { error } = await db.from("profiles").update({ role: "user" }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  const name = (p.display_name as string | null)?.split(" ")[0] ?? "";
  const wa = p.whatsapp ? waLink(p.whatsapp as string, `¡Hola ${name}! 🐶 Ya podés entrar a Ringo: ${APP_URL()}/login\nInstalala en tu celu y armá tu semana ideal 💪🏻`) : undefined;
  return { ok: "Cuenta aprobada.", wa };
}

/** Rechazar una solicitud: borra la cuenta. */
export async function rejectAccount(userId: string): Promise<AdminResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("role").eq("id", userId).single();
  if (p?.role !== "pending") return { error: "Solo se rechazan solicitudes pendientes." };
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: "Solicitud rechazada." };
}

/** Pedido de contraseña: genera una temporal, la activa y devuelve el link de WhatsApp para mandarla. */
export async function resolvePasswordRequest(requestId: string): Promise<AdminResult & { wa?: string; password?: string }> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: r } = await db.from("password_requests").select("email, whatsapp, status").eq("id", requestId).single();
  if (!r || r.status !== "pending") return { error: "Ese pedido ya no está pendiente." };
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = list?.users.find((u) => (u.email ?? "").toLowerCase() === r.email);
  if (!user) return { error: "No hay ninguna cuenta con ese email. Descartá el pedido." };
  const password = friendlyPassword();
  const { error } = await db.auth.admin.updateUserById(user.id, { password });
  if (error) return { error: error.message };
  await Promise.all([
    db.from("profiles").update({ must_change_password: true, whatsapp: r.whatsapp }).eq("id", user.id),
    db.from("password_requests").update({ status: "done", resolved_at: new Date().toISOString() }).eq("id", requestId),
  ]);
  revalidatePath("/admin");
  const wa = waLink(
    r.whatsapp as string,
    `¡Hola! 🐶 Tu contraseña nueva de Ringo es: ${password}\nEntrá a ${APP_URL()}/login y elegí la tuya cuando te lo pida (o desde Ajustes).`,
  );
  return { ok: `Contraseña nueva: ${password}`, wa, password };
}

export async function dismissPasswordRequest(requestId: string): Promise<AdminResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("password_requests").update({ status: "dismissed", resolved_at: new Date().toISOString() }).eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: "Pedido descartado." };
}
