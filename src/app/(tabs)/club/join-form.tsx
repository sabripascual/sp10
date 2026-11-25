"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinClub, leaveClub, type ClubState } from "./actions";

export function JoinForm({ initialName, joined }: { initialName: string; joined: boolean }) {
  const [state, action, pending] = useActionState<ClubState, FormData>(joinClub, {});
  const [leaving, start] = useTransition();
  return (
    <form action={action} className="space-y-3">
      <input
        name="club_name"
        defaultValue={initialName}
        maxLength={20}
        placeholder="Tu nombre en el club (ej. Sabri)"
        className="h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent"
        required
      />
      {state.error && <p className="text-sm">{state.error}</p>}
      <Button type="submit" variant={joined ? "secondary" : "primary"} size={joined ? "default" : "lg"} className="w-full" disabled={pending}>
        {pending ? "Guardando…" : joined ? "Cambiar nombre" : "🐶 Sumarme al Ringo Club"}
      </Button>
      {joined && (
        <button
          type="button"
          disabled={leaving}
          onClick={() => {
            if (confirm("¿Salir del Ringo Club? Dejás de aparecer en el ranking.")) start(async () => void (await leaveClub()));
          }}
          className="w-full py-2 text-sm text-muted underline"
        >
          Salir del club
        </button>
      )}
    </form>
  );
}
