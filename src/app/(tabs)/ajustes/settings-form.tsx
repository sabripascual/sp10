"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/profile";
import { FastProtocolPicker } from "@/components/fast/fast-protocol";
import { updateSettings, type SettingsState } from "./actions";

const inputClass =
  "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4">
        <div>
          <CardTitle>Ayuno</CardTitle>
          <CardDescription>Elegí tu ventana. Mismo horario todos los días.</CardDescription>
        </div>
        <FastProtocolPicker start={profile.fast_start.slice(0, 5)} end={profile.fast_end.slice(0, 5)} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Meta de fuerza</CardTitle>
          <CardDescription>Sesiones por semana (lunes a domingo).</CardDescription>
        </div>
        <input
          name="strength_goal"
          type="number"
          inputMode="numeric"
          min={1}
          max={7}
          defaultValue={profile.strength_goal}
          className={inputClass}
          required
        />
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
    </form>
  );
}
