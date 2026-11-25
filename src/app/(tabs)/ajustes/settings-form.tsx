"use client";

import { useActionState, useState } from "react";
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

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});
  const [fasting, setFasting] = useState(profile.fasting_enabled !== false);

  return (
    <form action={action} className="space-y-4">
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
    </form>
  );
}
