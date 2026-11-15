import "server-only";
import * as webpush from "web-push";

export type Subscription = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url: string; tag?: string };

export const isPushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

function configure() {
  const site = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  webpush.setVapidDetails(
    site ? `https://${site}` : "https://sp10.vercel.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

/** Manda a todas las suscripciones. Devuelve los endpoints vencidos (para borrarlos). */
export async function sendPush(subs: Subscription[], payload: PushPayload) {
  configure();
  const expired: string[] = [];
  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60, urgency: "normal" },
        );
        delivered++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) expired.push(s.endpoint);
        else console.error("push error", code, (e as Error).message);
      }
    }),
  );
  return { delivered, expired };
}
