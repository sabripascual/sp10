"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelRequest, requestJoin } from "@/app/(tabs)/club/actions";
import type { DirectoryClub } from "@/lib/club-data";
import { cn } from "@/lib/utils";

const input = "h-11 w-full min-w-0 flex-1 rounded-xl bg-bg px-3 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

/** Listado de clubes: en los públicos se puede pedir entrar; los privados son solo con invitación. */
export function ClubDirectory({ clubs, defaultName }: { clubs: DirectoryClub[]; defaultName: string }) {
  const [asking, setAsking] = useState<string | null>(null);
  const [name, setName] = useState(defaultName);
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!clubs.length) return <p className="text-sm text-muted">Todavía no hay clubes. ¡Creá el primero!</p>;

  return (
    <ul className="divide-y divide-muted/30">
      {clubs.map((c) => (
        <li key={c.id} className="space-y-2 py-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.name}</p>
              <p className="truncate text-xs text-muted">
                Dueña: {c.ownerName} · {c.memberCount}/30 {c.memberCount === 1 ? "miembro" : "miembros"}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                c.visibility === "public" ? "bg-accent text-accent-fg" : "bg-bg text-muted",
              )}
            >
              {c.visibility === "public" ? "🌎 Público" : "🔒 Privado"}
            </span>
          </div>

          {c.isMember ? (
            <Link href={`/club?c=${c.id}`} className="inline-block text-sm font-bold">
              ✅ Ya sos miembro · <span className="underline">ver el club</span>
            </Link>
          ) : c.visibility === "private" ? (
            <p className="text-xs text-muted">Solo con invitación: pedile el link a la dueña.</p>
          ) : c.requested ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold">⏳ Solicitud enviada</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => void (await cancelRequest(c.id)))}
                className="text-xs text-muted underline"
              >
                Cancelar
              </button>
            </div>
          ) : c.full ? (
            <p className="text-xs text-muted">Está lleno (30 de 30).</p>
          ) : asking === c.id ? (
            <div className="flex gap-2">
              <input className={input} maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre en el club" aria-label="Tu nombre en el club" />
              <button
                type="button"
                disabled={pending || !name.trim()}
                onClick={() =>
                  start(async () => {
                    const r = await requestJoin(c.id, name);
                    setMsg({ id: c.id, text: r.error ?? r.ok ?? "" });
                    if (!r.error) setAsking(null);
                  })
                }
                className="h-11 shrink-0 rounded-full bg-accent px-4 text-sm font-black text-accent-fg disabled:opacity-50"
              >
                {pending ? "…" : "Enviar"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAsking(c.id)}
              className="rounded-full bg-accent px-4 py-2 text-sm font-black text-accent-fg active:scale-95"
            >
              🙋 Solicitar unirme
            </button>
          )}
          {msg?.id === c.id && <p className="text-xs font-bold">{msg.text}</p>}
        </li>
      ))}
    </ul>
  );
}
