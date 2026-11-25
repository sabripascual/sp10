import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfigured, sendPush, type Subscription } from "@/lib/push";

/** Aviso push a todas las admins (solicitudes, pedidos de contraseña). Si algo falla, no corta nada. */
export async function notifyAdmins(body: string, url = "/admin") {
  try {
    if (!isPushConfigured()) return;
    const db = createAdminClient();
    const { data: admins } = await db.from("profiles").select("id").eq("role", "admin");
    const ids = (admins ?? []).map((a) => a.id as string);
    if (!ids.length) return;
    const { data: subs } = await db.from("push_subscriptions").select("endpoint, p256dh, auth").in("user_id", ids);
    if (!subs?.length) return;
    const { expired } = await sendPush(subs as Subscription[], { title: "Ringo · Panel", body, url, tag: "admin" });
    if (expired.length) await db.from("push_subscriptions").delete().in("endpoint", expired);
  } catch {
    /* el aviso es un extra */
  }
}

/** Contraseña temporal fácil de dictar: "perrita-4821". */
export function friendlyPassword() {
  const words = ["perrita", "fierrito", "huesito", "ringo", "crack", "diosa", "pelota", "vincha"];
  const bytes = crypto.getRandomValues(new Uint32Array(2));
  return `${words[bytes[0] % words.length]}-${String(1000 + (bytes[1] % 9000))}`;
}
