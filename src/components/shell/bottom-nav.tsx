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

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-muted/30 bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
