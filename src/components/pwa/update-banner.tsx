"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const MINE = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
const EVERY_MS = 5 * 60_000;

/**
 * Si hay una versión nueva de Ringo desplegada, muestra un botón para actualizar.
 * Revisa al abrir la app, al volver a ella y cada 5 minutos.
 */
export function UpdateBanner() {
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!MINE) return;
    let last = 0;
    const check = async () => {
      if (Date.now() - last < 30_000) return;
      last = Date.now();
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await r.json()) as { version?: string };
        if (version && version !== MINE) setStale(true);
      } catch {
        /* sin conexión: ya revisa la próxima */
      }
    };
    check();
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    const t = setInterval(check, EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(t);
    };
  }, []);

  const update = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch {
      /* igual recarga */
    }
    window.location.reload();
  };

  if (!stale) return null;
  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-accent py-2.5 pl-4 pr-2.5 text-accent-fg shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      <p className="flex-1 text-sm font-extrabold leading-tight">🐶 ¡Hay una versión nueva de Ringo!</p>
      <button
        type="button"
        onClick={update}
        disabled={busy}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent-fg px-4 text-sm font-black text-accent active:scale-95"
      >
        <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} />
        {busy ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );
}
