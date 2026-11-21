"use client";

import { useActionState, useState } from "react";
import { createAccount, type AdminResult } from "@/app/(tabs)/admin/actions";
import { Button } from "@/components/ui/button";
import { Chips } from "@/components/training/chips";

const inputClass = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

/** Alta de una cuenta nueva: email + contraseña inicial (se la pasás a tu amiga). */
export function CreateAccount() {
  const [state, action, pending] = useActionState<AdminResult, FormData>(createAccount, {});
  const [role, setRole] = useState<"user" | "admin">("user");
  return (
    <form action={action} className="space-y-3">
      <input name="email" type="email" inputMode="email" autoCapitalize="none" placeholder="Email" required className={inputClass} />
      <input name="password" type="text" autoCapitalize="none" placeholder="Contraseña inicial (8+ caracteres)" required minLength={8} className={inputClass} />
      <Chips
        cols={2}
        value={role}
        onChange={setRole}
        options={[
          { value: "user", label: "Usuaria" },
          { value: "admin", label: "Admin" },
        ]}
      />
      <input type="hidden" name="role" value={role} />
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
      {state.error && <p className="text-sm font-bold">{state.error}</p>}
      {state.ok && <p className="text-sm font-bold text-accent">{state.ok}</p>}
    </form>
  );
}
