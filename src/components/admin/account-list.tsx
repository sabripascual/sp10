"use client";

import { useState, useTransition } from "react";
import { resetPassword, setRole } from "@/app/(tabs)/admin/actions";
import type { AccountRow } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const ROLE: Record<AccountRow["role"], string> = { admin: "Admin", user: "Usuaria", disabled: "Pausada" };

function ago(iso: string | null) {
  if (!iso) return "nunca";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
}

/** Cuentas de Ringo con su uso y acciones de admin. */
export function AccountList({ accounts, meId }: { accounts: AccountRow[]; meId: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const act = (fn: () => Promise<{ error?: string; ok?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? r.ok ?? null);
    });

  return (
    <div className="space-y-2">
      {msg && <p className="text-sm font-bold">{msg}</p>}
      <ul className="divide-y divide-muted/30">
        {accounts.map((a) => (
          <li key={a.id} className="py-3">
            <button className="w-full text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate font-bold", a.role === "disabled" && "text-muted line-through")}>{a.email}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                    a.role === "admin" ? "bg-accent text-accent-fg" : "bg-bg text-muted",
                  )}
                >
                  {ROLE[a.role]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                Último uso {ago(a.lastActivity ?? a.lastSignIn)} · ⏱️ {a.fasts30} · 💪🏻 {a.workouts30} · 📏 {a.checks} · 😈 {a.events}
                {a.push ? " · 🔔" : ""}
              </p>
            </button>
            {open === a.id && a.id !== meId && (
              <div className="mt-2 flex flex-wrap gap-2">
                {a.role !== "disabled" ? (
                  <button disabled={pending} onClick={() => act(() => setRole(a.id, "disabled"))} className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold">
                    Pausar cuenta
                  </button>
                ) : (
                  <button disabled={pending} onClick={() => act(() => setRole(a.id, "user"))} className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold">
                    Reactivar
                  </button>
                )}
                {a.role !== "admin" && a.role !== "disabled" && (
                  <button disabled={pending} onClick={() => act(() => setRole(a.id, "admin"))} className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold">
                    Hacer admin
                  </button>
                )}
                {a.role === "admin" && (
                  <button disabled={pending} onClick={() => act(() => setRole(a.id, "user"))} className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold">
                    Quitar admin
                  </button>
                )}
                <button
                  disabled={pending}
                  onClick={() => {
                    const pw = prompt(`Contraseña nueva para ${a.email} (8+ caracteres):`);
                    if (pw) act(() => resetPassword(a.id, pw));
                  }}
                  className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold"
                >
                  Nueva contraseña
                </button>
              </div>
            )}
            {open === a.id && a.id === meId && <p className="mt-2 text-xs text-muted">Esta sos vos 🐶</p>}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted">⏱️ ayunos marcados y 💪🏻 entrenos de los últimos 30 días · 📏 controles · 😈 derrapes · 🔔 avisos activos. Nunca se muestran pesos, medidas ni fotos.</p>
    </div>
  );
}
