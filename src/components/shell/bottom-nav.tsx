"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Timer, Dumbbell, PersonStanding, TrendingUp, Trophy, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Hoy", icon: Sun },
  { href: "/ayuno", label: "Ayuno", icon: Timer },
  { href: "/entrenos", label: "Entrenos", icon: Dumbbell },
  { href: "/cuerpo", label: "Cuerpo", icon: PersonStanding },
  { href: "/progreso", label: "Progreso", icon: TrendingUp },
  { href: "/club", label: "Club", icon: Trophy },
];

// Botonera amarilla flotante: íconos negros nítidos, la activa en pastilla negra.
/** fasting = false: en lugar de Ayuno va Alimentación. */
export function BottomNav({ fasting = true }: { fasting?: boolean }) {
  const pathname = usePathname();
  const items = fasting ? tabs : tabs.map((t) => (t.href === "/ayuno" ? { href: "/alimentacion", label: "Comida", icon: Apple } : t));
  return (
    <nav className="fixed inset-x-3 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-full bg-accent text-accent-fg shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      <ul className="grid grid-cols-6 p-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch // precarga completa: al tocar, la pestaña ya está lista
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-full transition-colors",
                  active ? "bg-accent-fg text-accent" : "text-accent-fg active:bg-black/10",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={2.5} />
                <span className="text-[10px] font-extrabold leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
