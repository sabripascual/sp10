"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { isPushConfigured, sendPush } from "@/lib/push";
import { buildMessage, NOTIFY_KINDS, type NotifyKind } from "@/lib/phrases";

export type PushResult = { error?: string; ok?: boolean };

export async function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<PushResult> {
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth)
    return { error: "Suscripción inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: sub.userAgent?.slice(0, 200) },
    { onConflict: "endpoint" },
  );
  return error ? { error: error.message } : { ok: true };
}

export async function removeSubscription(endpoint: string): Promise<PushResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error ? { error: error.message } : { ok: true };
}

export async function sendTestPush(): Promise<PushResult> {
  if (!isPushConfigured()) return { error: "Faltan las claves VAPID en Vercel." };
  const profile = await getProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Este celular todavía no tiene los avisos activados." };
  const msg = buildMessage("week_goals", { pct: 50, falta: "1 fierrito", dia: "hoy" }, profile.nicknames, null);
  const { delivered, expired } = await sendPush(data, { title: "Ringo · prueba", body: msg.body, url: "/" });
  if (expired.length) await supabase.from("push_subscriptions").delete().in("endpoint", expired);
  return delivered ? { ok: true } : { error: "No llegó a ningún dispositivo. Probá desactivar y activar de nuevo." };
}

export async function updateNotifyPrefs(prefs: Partial<Record<NotifyKind, boolean>>): Promise<PushResult> {
  const clean = Object.fromEntries(
    NOTIFY_KINDS.map(({ kind }) => [kind, prefs[kind] !== false]),
  );
  const profile = await getProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ notify_prefs: clean }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { ok: true };
}
