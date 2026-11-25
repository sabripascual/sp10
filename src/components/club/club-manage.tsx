"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, X } from "lucide-react";
import { createClub, joinClub, leaveClub, removeMember, renameClub, renameMe, renewInvite, type ClubResult } from "@/app/(tabs)/club/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Avatar } from "@/components/shell/avatar";
import { cn } from "@/lib/utils";

const input = "h-12 w-full rounded-xl bg-bg px-4 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

/** Crear un club (botón + hoja). */
export function CreateClub({ defaultName, className, label = "+ Crear un club" }: { defaultName: string; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mine, setMine] = useState(defaultName);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="primary" size="lg" className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <div className="space-y-4">
            <div>
              <SheetTitle>Tu club 🏆</SheetTitle>
              <SheetDescription>Vos sos la dueña: invitás a tus amigas con un link y compiten entre ustedes.</SheetDescription>
            </div>
            <input className={input} placeholder="Nombre del club (ej. Las Pibas del Fútbol)" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
            <input className={input} placeholder="Tu nombre en el club" maxLength={20} value={mine} onChange={(e) => setMine(e.target.value)} />
            {msg && <p className="text-sm">{msg}</p>}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={pending || !name.trim() || !mine.trim()}
              onClick={() =>
                start(async () => {
                  const r = await createClub(name, mine);
                  if (r.error) return setMsg(r.error);
                  setOpen(false);
                  router.push(`/club?c=${r.clubId}`);
                })
              }
            >
              {pending ? "Creando…" : "Crear club"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Pantalla de invitación: nombre en el club y "Sumarme". */
export function JoinInvite({ code, defaultName }: { code: string; defaultName: string }) {
  const [mine, setMine] = useState(defaultName);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-3">
      <input className={input} placeholder="Tu nombre en el club" maxLength={20} value={mine} onChange={(e) => setMine(e.target.value)} />
      {msg && <p className="text-sm">{msg}</p>}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={pending || !mine.trim()}
        onClick={() =>
          start(async () => {
            const r = await joinClub(code, mine);
            if (r.error) return setMsg(r.error);
            router.push(`/club?c=${r.clubId}`);
          })
        }
      >
        {pending ? "Sumándote…" : "🐶 Sumarme"}
      </Button>
    </div>
  );
}

type Member = { id: string; name: string; avatar: string | null; isMe: boolean; role: "owner" | "member" };

/** Administrar el club: invitar, miembros, nombres, salir. La dueña ve más opciones. */
export function ClubManage({
  club,
  members,
  inviteUrl,
}: {
  club: { id: string; name: string; role: "owner" | "member"; myName: string; memberCount: number };
  members: Member[];
  inviteUrl: string;
}) {
  const owner = club.role === "owner";
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [clubName, setClubName] = useState(club.name);
  const [myName, setMyName] = useState(club.myName);
  const router = useRouter();
  const run = (fn: () => Promise<ClubResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? r.ok ?? null);
      if (!r.error) after?.();
    });

  const invite = async () => {
    const text = `¡Sumate a mi club de Ringo "${club.name}"! 🐶🏆 A ver quién es la perrita más constante: ${inviteUrl}`;
    try {
      if (navigator.share) return await navigator.share({ text });
      await navigator.clipboard.writeText(text);
      setMsg("Link copiado: pegalo en WhatsApp 📲");
    } catch {
      /* cancelado */
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-bold">{owner ? "Tu club" : "El club"}</p>
        <span className="text-xs font-bold text-muted">
          {club.memberCount} de 30 · {owner ? "sos la dueña 👑" : "sos miembro"}
        </span>
      </div>

      <button type="button" onClick={invite} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-black text-accent-fg active:scale-[0.98]">
        <Link2 className="size-5" /> Invitar amigas
      </button>

      <ul className="divide-y divide-muted/30">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2">
            <Avatar url={m.avatar} className="size-9 bg-bg" emojiClass="text-base" />
            <span className={cn("flex-1 truncate font-bold", m.isMe && "text-accent")}>
              {m.name}
              {m.isMe && " (vos)"}
              {m.role === "owner" && " 👑"}
            </span>
            {owner && !m.isMe && (
              <button
                type="button"
                aria-label={`Sacar a ${m.name}`}
                disabled={pending}
                onClick={() => confirm(`¿Sacar a ${m.name} del club?`) && run(() => removeMember(club.id, m.id))}
                className="grid size-8 place-items-center rounded-full text-muted active:bg-bg"
              >
                <X className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <details className="rounded-xl bg-bg p-3">
        <summary className="cursor-pointer text-sm font-bold">Opciones</summary>
        <div className="mt-3 space-y-3">
          {owner && <p className="text-xs font-bold text-muted">Nombre del club</p>}
          {owner && (
            <div className="flex gap-2">
              <input className={`${input} min-w-0 flex-1 bg-surface`} maxLength={40} value={clubName} onChange={(e) => setClubName(e.target.value)} aria-label="Nombre del club" />
              <Button className="h-12 shrink-0 bg-surface" disabled={pending} onClick={() => run(() => renameClub(club.id, clubName))}>
                Guardar
              </Button>
            </div>
          )}
          <p className="text-xs font-bold text-muted">Tu nombre en este club</p>
          <div className="flex gap-2">
            <input className={`${input} min-w-0 flex-1 bg-surface`} maxLength={20} value={myName} onChange={(e) => setMyName(e.target.value)} aria-label="Tu nombre en el club" />
            <Button className="h-12 shrink-0 bg-surface" disabled={pending} onClick={() => run(() => renameMe(club.id, myName))}>
              Guardar
            </Button>
          </div>
          {owner && (
            <button type="button" disabled={pending} onClick={() => run(() => renewInvite(club.id))} className="block text-sm font-bold underline">
              Renovar el link de invitación (el anterior deja de andar)
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              confirm(owner ? "¿Salir del club? Si quedan otras, la más antigua pasa a ser la dueña." : "¿Salir del club?") &&
              run(() => leaveClub(club.id), () => router.push("/club"))
            }
            className="block text-sm text-muted underline"
          >
            Salir del club
          </button>
        </div>
      </details>
      {msg && <p className="text-sm font-bold">{msg}</p>}
    </div>
  );
}

/** Selector de club (si estás en más de uno). */
export function ClubSwitcher({ clubs, current }: { clubs: { id: string; name: string }[]; current: string }) {
  if (clubs.length < 2) return null;
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {clubs.map((c) => (
        <Link
          key={c.id}
          href={`/club?c=${c.id}`}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold",
            c.id === current ? "bg-accent text-accent-fg" : "bg-surface text-fg",
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}

