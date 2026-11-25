"use client";

import { useActionState } from "react";
import { requestPasswordReset, signUp, type FormState } from "@/app/account-actions";
import { Button } from "@/components/ui/button";

export const authInput =
  "h-14 w-full rounded-2xl bg-surface px-4 text-base text-fg placeholder:text-muted outline-none focus:ring-2 focus:ring-fg/40";

function Done({ message }: { message: string }) {
  return <p className="rounded-2xl bg-surface p-5 text-lg font-bold leading-snug">{message}</p>;
}

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <Done message={state.message!} />;
  return (
    <form action={action} className="space-y-3">
      <input name="email" type="email" autoComplete="email" inputMode="email" placeholder="Tu email de Ringo" required className={authInput} />
      <input name="whatsapp" type="tel" autoComplete="tel" inputMode="tel" placeholder="WhatsApp (ej. 381 555 1234)" required className={authInput} />
      <p className="px-1 text-xs text-muted">Te mandamos la contraseña nueva a ese WhatsApp. Después la cambiás desde Ajustes.</p>
      {state.error && <p className="text-sm">{state.error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Pedir contraseña nueva"}
      </Button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  if (state.ok) return <Done message={state.message!} />;
  return (
    <form action={action} className="space-y-3">
      <input name="name" type="text" autoComplete="given-name" placeholder="Tu nombre" maxLength={40} required className={authInput} />
      <input name="email" type="email" autoComplete="email" inputMode="email" placeholder="Email" required className={authInput} />
      <input name="password" type="password" autoComplete="new-password" placeholder="Contraseña (8 o más)" minLength={8} required className={authInput} />
      <input name="whatsapp" type="tel" autoComplete="tel" inputMode="tel" placeholder="WhatsApp (ej. 381 555 1234)" required className={authInput} />
      <p className="px-1 text-xs text-muted">
        Tu cuenta queda esperando aprobación. Te avisamos por WhatsApp cuando esté lista (y lo usamos si te olvidás la contraseña).
      </p>
      {state.error && <p className="text-sm">{state.error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creando…" : "Crear mi cuenta"}
      </Button>
    </form>
  );
}
