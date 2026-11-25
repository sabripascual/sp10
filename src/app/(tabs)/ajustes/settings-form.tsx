"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/profile";
import { FastProtocolPicker } from "@/components/fast/fast-protocol";
import { FavoriteSportsPicker } from "./favorite-sports";
import { WeeklyGoalsPicker } from "./weekly-goals";
import { goalsOf } from "@/lib/goals";
import { updateSettings, type SettingsState } from "./actions";

const inputClass =
  "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

/** Foto del formulario para saber si hay cambios sin guardar. */
const snapshot = (form: HTMLFormElement | null) =>
  form ? JSON.stringify([...new FormData(form).entries()].map(([k, v]) => [k, String(v)])) : "";

export function SettingsForm({ profile }: { profile: Profile }) {
  // Descartar = volver a montar el formulario con lo guardado
  const [version, setVersion] = useState(0);
  return <Form key={version} profile={profile} onDiscard={() => setVersion((v) => v + 1)} />;
}

function Form({ profile, onDiscard }: { profile: Profile; onDiscard: () => void }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});
  const [fasting, setFasting] = useState(profile.fasting_enabled !== false);
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const saved = useRef("");
  const [dirty, setDirty] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null); // a dónde quería ir
  const goAfterSave = useRef<string | null>(null);

  const check = useCallback(() => setTimeout(() => setDirty(snapshot(form.current) !== saved.current), 0), []);

  // Foto inicial
  useEffect(() => {
    saved.current = snapshot(form.current);
  }, []);

  // Guardó bien: lo actual pasa a ser lo guardado (y si quería irse, se va)
  useEffect(() => {
    if (state.error) goAfterSave.current = null; // no se pudo guardar: se queda
    if (!state.ok) return;
    const t = setTimeout(() => {
      saved.current = snapshot(form.current);
      setDirty(false);
      if (goAfterSave.current) router.push(goAfterSave.current);
      goAfterSave.current = null;
    }, 0);
    return () => clearTimeout(t);
  }, [state, router]);

  // Con cambios: frenar los links (barra de abajo, arriba) y el cierre/recarga de la página
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(url.pathname + url.search + url.hash);
    };
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty]);

  const saveAndGo = () => {
    goAfterSave.current = leaveTo;
    setLeaveTo(null);
    form.current?.requestSubmit();
  };
  const discardAndGo = () => {
    const to = leaveTo;
    setLeaveTo(null);
    setDirty(false);
    if (to) router.push(to);
    else onDiscard();
  };

  return (
    <form ref={form} action={action} onInput={check} onChange={check} onClick={check} className={dirty ? "space-y-4 pb-20" : "space-y-4"}>
      <Card className="space-y-4">
        <div>
          <CardTitle>Ayuno</CardTitle>
          <CardDescription>{fasting ? "Elegí tu ventana. Mismo horario todos los días." : "Apagado: no te muestro nada del ayuno."}</CardDescription>
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="font-bold">Hago ayuno intermitente</span>
          <input
            name="fasting_enabled"
            type="checkbox"
            checked={fasting}
            onChange={(e) => setFasting(e.target.checked)}
            className="size-6 accent-[#ffe900]"
          />
        </label>
        <div className={fasting ? "space-y-4" : "hidden"}>
          <FastProtocolPicker start={profile.fast_start.slice(0, 5)} end={profile.fast_end.slice(0, 5)} />
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Tu semana ideal 🎯</CardTitle>
          <CardDescription>
            Lo mínimo que querés cumplir de lunes a domingo. Con esto te digo a qué % vas, te aviso jueves y domingo, y sale tu nivel.
          </CardDescription>
        </div>
        <WeeklyGoalsPicker initial={goalsOf(profile.weekly_goals, profile.strength_goal)} fasting={fasting} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Tus deportes frecuentes</CardTitle>
          <CardDescription>Hasta 4. Son los bloques de un toque en Hoy; el resto se carga desde Entrenos.</CardDescription>
        </div>
        <FavoriteSportsPicker initial={profile.favorite_sports} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Apodos</CardTitle>
          <CardDescription>Separados por coma. Uno al azar en cada saludo y aviso.</CardDescription>
        </div>
        <input
          name="nicknames"
          type="text"
          defaultValue={profile.nicknames.join(", ")}
          className={inputClass}
          autoCapitalize="none"
          required
        />
      </Card>

      <Card className="space-y-3">
        <div>
          <CardTitle>Primer control</CardTitle>
          <CardDescription>Después se repite cada 14 días desde el último.</CardDescription>
        </div>
        <input name="body_check_start" type="date" defaultValue={profile.body_check_start ?? ""} className={inputClass} />
      </Card>

      <Card>
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-lg font-bold">Número oculto</span>
            <span className="block text-sm text-muted">Ver solo la tendencia del peso.</span>
          </span>
          <input
            name="hide_weight"
            type="checkbox"
            defaultChecked={profile.hide_weight}
            className="size-6 accent-[#ffe900]"
          />
        </label>
      </Card>

      {state.error && <p className="text-sm">{state.error}</p>}
      {state.ok && <p className="text-sm text-muted">Guardado. Sos una máquina.</p>}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>

      {/* Barra fija mientras haya cambios sin guardar */}
      {dirty && (
        <div className="fixed inset-x-3 bottom-[calc(max(0.5rem,env(safe-area-inset-bottom))+4.25rem)] z-40 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-surface p-2 pl-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)] ring-1 ring-accent/40">
          <p className="flex-1 text-sm font-bold">Tenés cambios sin guardar</p>
          <Button type="button" variant="ghost" size="sm" className="text-muted" disabled={pending} onClick={onDiscard}>
            Descartar
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      )}

      {/* Quiso irse con cambios: guardar o descartar */}
      {leaveTo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6" onClick={() => setLeaveTo(null)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xl font-black">¿Guardamos los cambios? 🐶</p>
              <p className="mt-1 text-sm text-muted">Tocaste cosas en Ajustes y todavía no las guardaste.</p>
            </div>
            <Button type="button" variant="primary" size="lg" className="w-full" disabled={pending} onClick={saveAndGo}>
              Guardar y seguir
            </Button>
            <Button type="button" className="w-full bg-bg" onClick={discardAndGo}>
              Descartar cambios
            </Button>
            <button type="button" className="w-full py-1 text-sm text-muted underline" onClick={() => setLeaveTo(null)}>
              Seguir editando
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
