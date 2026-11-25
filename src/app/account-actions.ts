"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeWhatsapp } from "@/lib/whatsapp";
import { notifyAdmins } from "@/lib/admin-notify";

export type FormState = { ok?: boolean; error?: string; message?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * "Olvidé mi contraseña": guarda el pedido con el WhatsApp y le avisa a la admin.
 * Responde siempre lo mismo, exista o no la cuenta (así nadie averigua quién usa Ringo).
 */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const whatsapp = normalizeWhatsapp(String(formData.get("whatsapp") ?? ""));
  if (!EMAIL_RE.test(email)) return { error: "Revisá el email." };
  if (!whatsapp) return { error: "Revisá el WhatsApp (con código de área, ej. 381 555 1234)." };

  const ok: FormState = { ok: true, message: "Listo, en breve te mandamos una contraseña nueva por WhatsApp 📲" };
  const db = createAdminClient();
  const since = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

  // Anti-abuso: 1 pedido por email cada 10 min, y no más de 20 por hora en total
  const [{ count: mine }, { count: all }] = await Promise.all([
    db.from("password_requests").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since(10)),
    db.from("password_requests").select("id", { count: "exact", head: true }).gte("created_at", since(60)),
  ]);
  if ((mine ?? 0) > 0) return ok;
  if ((all ?? 0) >= 20) return ok;

  const { error } = await db.from("password_requests").insert({ email, whatsapp });
  if (error) return { error: "No pude guardar el pedido. Probá de nuevo en un rato." };
  await notifyAdmins(`🔑 ${email} pidió nueva contraseña. Tocá para generarla y mandársela`, "/admin#contrasenas");
  return ok;
}

/** Crear cuenta: queda pendiente hasta que la admin la apruebe desde el Panel Ringo. */
export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const whatsapp = normalizeWhatsapp(String(formData.get("whatsapp") ?? ""));
  if (!name) return { error: "Decinos tu nombre." };
  if (!EMAIL_RE.test(email)) return { error: "Revisá el email." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (!whatsapp) return { error: "Revisá el WhatsApp (con código de área, ej. 381 555 1234)." };

  const db = createAdminClient();
  // Anti-abuso: si hay muchas solicitudes esperando, se frena
  const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "pending");
  if ((count ?? 0) >= 50) return { error: "Hay muchas solicitudes en espera. Probá en un rato 🙏" };

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { error: error.message.includes("already") ? "Ya hay una cuenta con ese email. ¿Olvidaste tu contraseña?" : "No pude crear la cuenta. Probá de nuevo." };

  const { error: pErr } = await db
    .from("profiles")
    .upsert({ id: data.user.id, role: "pending", display_name: name, whatsapp, nicknames: [name.split(" ")[0].toLowerCase(), "crack", "reina"] }, { onConflict: "id" });
  if (pErr) {
    await db.auth.admin.deleteUser(data.user.id); // que no quede una cuenta activa a medias
    return { error: "No pude crear la cuenta. Probá de nuevo." };
  }
  await notifyAdmins(`🐶 Nueva solicitud de cuenta: ${name} (${email}). Tocá para aprobarla`, "/admin#solicitudes");
  return { ok: true, message: "¡Listo! Tu cuenta está esperando aprobación 🐶 Te avisamos por WhatsApp cuando esté activa." };
}

/** Cambiar la propia contraseña (Ajustes o después de un reseteo). */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");
  if (password.length < 8) return { error: "Tiene que tener al menos 8 caracteres." };
  if (password !== repeat) return { error: "Las dos no coinciden. Probá de nuevo." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Se cerró la sesión. Volvé a entrar." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message.includes("different") ? "Tiene que ser distinta de la anterior." : "No pude cambiarla. Probá de nuevo." };
  await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
  return { ok: true, message: "¡Contraseña cambiada! 🔒" };
}


/** Guardar el WhatsApp de recuperación. */
export async function updateWhatsapp(_prev: FormState, formData: FormData): Promise<FormState> {
  const whatsapp = normalizeWhatsapp(String(formData.get("whatsapp") ?? ""));
  if (!whatsapp) return { error: "Revisá el WhatsApp (con código de área, ej. 381 555 1234)." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Se cerró la sesión. Volvé a entrar." };
  const { error } = await supabase.from("profiles").update({ whatsapp }).eq("id", userId);
  if (error) return { error: error.message.includes("whatsapp") ? "Falta correr la migración 0020." : error.message };
  return { ok: true, message: "WhatsApp guardado." };
}
