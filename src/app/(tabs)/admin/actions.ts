"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-data";

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
