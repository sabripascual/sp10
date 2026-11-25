"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

const MINE = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
const EVERY_MS = 2 * 60_000;
const SEEN_KEY = "ringo-version";

/**
 * Versiones de Ringo:
 *  - Si hay una nueva desplegada y la app abierta es la vieja → barra "Hay una versión nueva" con Actualizar.
 *    Revisa al abrir, al volver a la app (visibilidad, foco, pageshow), al cambiar de pestaña, al recuperar conexión y cada 2 min.
 *  - Si la app ya se recargó sola con una versión nueva (el iPhone suele recargarla al reabrirla) → cartelito "Ringo se actualizó".
 */
export function UpdateBanner() {
  const [stale, setStale] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const last = useRef(0);

  const check = useRef(async () => {
    if (!MINE || Date.now() - last.current < 15_000) return;
    last.current = Date.now();
    try {
      const r = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
      const { version } = (await r.json()) as { version?: string };
      if (version && version !== MINE) setStale(true);
    } catch {
      /* sin conexión: ya revisa la próxima */
    }
  });

  // ¿Se actualizó desde la última vez que la abriste?
  useEffect(() => {
    if (!MINE) return;
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      if (seen && seen !== MINE) {
        setUpdated(true);
        setTimeout(() => setUpdated(false), 4500);
      }
      localStorage.setItem(SEEN_KEY, MINE);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  useEffect(() => {
    const run = () => void check.current();
    const onVisible = () => document.visibilityState === "visible" && run();
    run();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", run);
    window.addEventListener("pageshow", run);
    window.addEventListener("online", run);
    const t = setInterval(run, EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", run);
      window.removeEventListener("pageshow", run);
      window.removeEventListener("online", run);
      clearInterval(t);
    };
  }, []);

  // Cada vez que cambiás de pestaña también se fija
  useEffect(() => {
    void check.current();
  }, [pathname]);

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

  if (stale)
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

  if (updated)
    return (
      <button
        type="button"
        onClick={() => setUpdated(false)}
        className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[60] mx-auto block max-w-md rounded-2xl bg-surface px-4 py-3 text-left text-sm font-extrabold text-fg shadow-[0_8px_30px_rgba(0,0,0,0.6)] ring-1 ring-accent/50 animate-in fade-in slide-in-from-top-2"
      >
        ✨ Ringo se actualizó: ya tenés la última versión
      </button>
    );
  return null;
}
