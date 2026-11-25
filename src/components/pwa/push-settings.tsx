"use client";

import { useEffect, useState, useTransition } from "react";
import { removeSubscription, saveSubscription, sendTestPush, updateNotifyPrefs } from "@/app/(tabs)/ajustes/push-actions";
import { Button } from "@/components/ui/button";
import { FAST_KINDS, NOTIFY_KINDS, type NotifyKind } from "@/lib/phrases";
import { cn } from "@/lib/utils";

type Status = "loading" | "unsupported" | "install" | "denied" | "off" | "on";

/** Registra el service worker si hace falta y espera a que esté activo (máx 5 s). */
async function getRegistration() {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  if (reg.active) return reg;
  return await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
  ]);
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushSettings({
  vapidPublicKey,
  prefs,
  fasting = true,
}: {
  vapidPublicKey: string;
  prefs: Record<string, boolean>;
  fasting?: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [local, setLocal] = useState<Record<string, boolean>>(prefs);

  useEffect(() => {
    (async () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setStatus(isIOS && !standalone ? "install" : "unsupported");
      }
      if (isIOS && !standalone) return setStatus("install");
      if (Notification.permission === "denied") return setStatus("denied");
      try {
        const reg = await getRegistration();
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "on" : "off");
      } catch {
        setStatus("off");
      }
    })();
  }, []);

  const enable = () =>
    start(async () => {
      setMsg(null);
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setStatus(perm === "denied" ? "denied" : "off");
      let reg: ServiceWorkerRegistration;
      try {
        reg = await getRegistration();
      } catch {
        return setMsg("No pude preparar los avisos. Cerrá la app del todo y volvé a abrirla.");
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await saveSubscription({ ...json, userAgent: navigator.userAgent });
      if (res.error) return setMsg(res.error);
      setStatus("on");
      setMsg("¡Avisos activados! Ya te puedo hablar al oído.");
    });

  const disable = () =>
    start(async () => {
      const reg = await getRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removeSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
      setMsg(null);
    });

  const test = () =>
    start(async () => {
      const res = await sendTestPush();
      setMsg(res.error ?? "Mandé un aviso de prueba. Debería llegarte en unos segundos.");
    });

  const toggle = (kind: NotifyKind) => {
    const next = { ...local, [kind]: local[kind] === false };
    setLocal(next);
    start(async () => void (await updateNotifyPrefs(next)));
  };

  return (
    <div className="space-y-4">
      {status === "loading" && <p className="text-sm text-muted">Revisando los avisos…</p>}
      {status === "install" && (
        <p className="rounded-xl bg-bg p-3 text-sm">
          En iPhone los avisos funcionan con la app instalada: en Safari tocá <b>Compartir</b> →{" "}
          <b>Agregar a inicio</b>, abrí Ringo desde el ícono del perrito y volvé acá.
        </p>
      )}
      {status === "unsupported" && <p className="text-sm text-muted">Este navegador no soporta avisos.</p>}
      {status === "denied" && (
        <p className="rounded-xl bg-bg p-3 text-sm">
          Los avisos están bloqueados. Activalos en Ajustes del iPhone → Notificaciones → Ringo.
        </p>
      )}
      {status === "off" && (
        <Button variant="primary" size="lg" className="w-full" disabled={pending} onClick={enable}>
          Activar avisos
        </Button>
      )}
      {status === "on" && (
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-bg" disabled={pending} onClick={test}>
            Probar aviso
          </Button>
          <Button variant="ghost" className="text-muted" disabled={pending} onClick={disable}>
            Desactivar
          </Button>
        </div>
      )}
      {msg && <p className="text-sm font-bold">{msg}</p>}

      <ul className="divide-y divide-muted/30">
        {NOTIFY_KINDS.filter(({ kind }) => fasting || !FAST_KINDS.includes(kind)).map(({ kind, label, when }) => {
          const on = local[kind] !== false;
          return (
            <li key={kind}>
              <button type="button" onClick={() => toggle(kind)} className="flex w-full items-center gap-3 py-3 text-left">
                <span className="flex-1">
                  <span className="block font-bold">{label}</span>
                  <span className="block text-xs text-muted">{when}</span>
                </span>
                <span
                  role="switch"
                  aria-checked={on}
                  className={cn("relative h-7 w-12 rounded-full transition-colors", on ? "bg-accent" : "bg-bg")}
                >
                  <span
                    className={cn(
                      "absolute top-1 size-5 rounded-full transition-all",
                      on ? "left-6 bg-accent-fg" : "left-1 bg-muted",
                    )}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">Silencio nocturno de 23:00 a 8:30. Ningún aviso menciona tu peso.</p>
    </div>
  );
}
