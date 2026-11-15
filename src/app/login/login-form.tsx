"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-14 w-full rounded-2xl bg-surface px-4 text-base text-fg placeholder:text-muted outline-none focus:ring-2 focus:ring-fg/40";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-3">
      <input
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="Email"
        required
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Contraseña"
        required
        className={inputClass}
      />
      {state.error && <p className="text-sm text-fg">{state.error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
