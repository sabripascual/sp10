"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Timer, Dumbbell, PersonStanding, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Hoy", icon: Sun },
  { href: "/ayuno", label: "Ayuno", icon: Timer },
  { href: "/entrenos", label: "Entrenos", icon: Dumbbell },
  { href: "/cuerpo", label: "Cuerpo", icon: PersonStanding },
  { href: "/progreso", label: "Progreso", icon: TrendingUp },
];

// Botonera amarilla: la pestaña activa va en una pastilla negra.
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-accent pb-[env(safe-area-inset-bottom)] text-accent-fg">
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pt-2 pb-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-extrabold"
              >
                <span
                  className={cn(
                    "grid h-8 w-12 place-items-center rounded-full transition-colors",
                    active ? "bg-accent-fg text-accent" : "text-accent-fg/60",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.75 : 2.25} />
                </span>
                <span className={active ? "text-accent-fg" : "text-accent-fg/60"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
