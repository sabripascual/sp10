"use client";

import { useActionState, useEffect, useState } from "react";
import { changePassword, updateWhatsapp, type FormState } from "@/app/account-actions";
import { Button } from "@/components/ui/button";
import { prettyWhatsapp } from "@/lib/whatsapp";

const input = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

/** Nueva contraseña + repetir. */
export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  useEffect(() => {
    if (state.ok && onDone) {
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
  }, [state, onDone]);
  return (
    <form action={action} className="space-y-2">
      <input name="password" type="password" autoComplete="new-password" placeholder="Contraseña nueva (8 o más)" minLength={8} required className={input} />
      <input name="repeat" type="password" autoComplete="new-password" placeholder="Repetila" minLength={8} required className={input} />
      {state.error && <p className="text-sm">{state.error}</p>}
      {state.ok && <p className="text-sm font-bold">{state.message}</p>}
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}

/** WhatsApp de recuperación. */
export function WhatsappForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateWhatsapp, {});
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input
        name="whatsapp"
        type="tel"
        inputMode="tel"
        defaultValue={prettyWhatsapp(current)}
        placeholder="WhatsApp (ej. 381 555 1234)"
        required
        className={`${input} min-w-0 flex-1`}
      />
      <Button type="submit" className="h-12 shrink-0 bg-bg" disabled={pending}>
        {pending ? "…" : "Guardar"}
      </Button>
      {(state.error || state.ok) && <p className="basis-full text-sm">{state.error ?? state.message}</p>}
    </form>
  );
}

/** Después de un reseteo: ofrece elegir la contraseña propia ("Ahora no" la esconde hasta la próxima vez que abra la app). */
export function TempPasswordPrompt() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("ringo-temp-pw-later")) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  const later = () => {
    try {
      sessionStorage.setItem("ringo-temp-pw-later", "1");
    } catch {
      /* nada */
    }
    setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-black/75 p-6" role="dialog" aria-modal="true" aria-label="Elegí tu contraseña">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="text-xl font-black">🔑 Entraste con una contraseña temporal</p>
          <p className="mt-1 text-sm text-muted">Elegí la tuya así no dependés de la que te mandamos.</p>
        </div>
        <ChangePasswordForm onDone={() => setOpen(false)} />
        <button type="button" onClick={later} className="w-full py-1 text-sm text-muted underline">
          Ahora no
        </button>
      </div>
    </div>
  );
}
