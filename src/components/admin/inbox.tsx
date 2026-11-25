"use client";

import { useState, useTransition } from "react";
import { approveAccount, dismissPasswordRequest, rejectAccount, resolvePasswordRequest } from "@/app/(tabs)/admin/actions";
import type { Applicant, PasswordRequest } from "@/lib/admin-data";
import { prettyWhatsapp } from "@/lib/whatsapp";

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `hace ${Math.max(m, 1)} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} días`;
}

/** Lo que queda para mandar por WhatsApp después de una acción (no desaparece al refrescar la lista). */
type Outbox = { title: string; detail?: string; wa?: string };

const btn = "rounded-full px-3 py-1.5 text-xs font-black active:scale-95 disabled:opacity-50";

/** Solicitudes de cuenta y pedidos de contraseña: lo que espera a la admin. */
export function AdminInbox({ applicants, requests }: { applicants: Applicant[]; requests: PasswordRequest[] }) {
  const [pending, start] = useTransition();
  const [out, setOut] = useState<Outbox[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const push = (o: Outbox) => setOut((cur) => [o, ...cur]);

  return (
    <div className="space-y-4">
      {out.map((o, i) => (
        <div key={i} className="space-y-2 rounded-2xl bg-accent p-4 text-accent-fg">
          <p className="font-black">{o.title}</p>
          {o.detail && <p className="text-sm font-bold">{o.detail}</p>}
          {o.wa && (
            <a href={o.wa} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-full bg-accent-fg font-black text-accent">
              Mandar por WhatsApp
            </a>
          )}
        </div>
      ))}
      {msg && <p className="text-sm font-bold">{msg}</p>}

      {applicants.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-surface p-5">
          <p className="text-lg font-bold">🐶 Solicitudes de cuenta ({applicants.length})</p>
          <ul className="divide-y divide-muted/30">
            {applicants.map((a) => (
              <li key={a.id} className="space-y-2 py-3">
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs text-muted">
                    {a.email} · {a.whatsapp ? prettyWhatsapp(a.whatsapp) : "sin WhatsApp"} · {ago(a.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={pending}
                    className={`${btn} bg-accent text-accent-fg`}
                    onClick={() =>
                      start(async () => {
                        const r = await approveAccount(a.id);
                        if (r.error) return setMsg(r.error);
                        push({ title: `✅ ${a.name} ya puede entrar`, detail: r.wa ? "Avisale:" : "No dejó WhatsApp: avisale por otro lado.", wa: r.wa });
                      })
                    }
                  >
                    Aprobar
                  </button>
                  <button
                    disabled={pending}
                    className={`${btn} bg-bg`}
                    onClick={() => {
                      if (confirm(`¿Rechazar a ${a.name}? Se borra la cuenta.`))
                        start(async () => {
                          const r = await rejectAccount(a.id);
                          setMsg(r.error ?? r.ok ?? null);
                        });
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-surface p-5">
          <p className="text-lg font-bold">🔑 Pedidos de contraseña ({requests.length})</p>
          <ul className="divide-y divide-muted/30">
            {requests.map((r) => (
              <li key={r.id} className="space-y-2 py-3">
                <div>
                  <p className="font-bold">{r.name ?? r.email}</p>
                  <p className="text-xs text-muted">
                    {r.email} · {prettyWhatsapp(r.whatsapp)} · {ago(r.createdAt)}
                  </p>
                  {!r.userId && <p className="text-xs font-bold text-[#fb923c]">No hay ninguna cuenta con ese email</p>}
                </div>
                <div className="flex gap-2">
                  {r.userId && (
                    <button
                      disabled={pending}
                      className={`${btn} bg-accent text-accent-fg`}
                      onClick={() =>
                        start(async () => {
                          const res = await resolvePasswordRequest(r.id);
                          if (res.error) return setMsg(res.error);
                          push({ title: `🔑 Nueva contraseña para ${r.name ?? r.email}`, detail: res.password, wa: res.wa });
                        })
                      }
                    >
                      Generar contraseña
                    </button>
                  )}
                  <button
                    disabled={pending}
                    className={`${btn} bg-bg`}
                    onClick={() =>
                      start(async () => {
                        const res = await dismissPasswordRequest(r.id);
                        setMsg(res.error ?? res.ok ?? null);
                      })
                    }
                  >
                    Descartar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
