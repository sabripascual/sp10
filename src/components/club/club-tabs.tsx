"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** "En vivo" (semana en curso) / "Podio" (semana que cerró). El lunes arranca en el podio. */
export function ClubTabs({ live, podium, startOnPodium }: { live: ReactNode; podium: ReactNode; startOnPodium: boolean }) {
  const [tab, setTab] = useState<"live" | "podium">(startOnPodium ? "podium" : "live");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1" role="tablist">
        {(
          [
            ["live", "🔴 Esta semana"],
            ["podium", "🏆 Semana pasada"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("h-10 rounded-full text-sm font-extrabold transition-colors", tab === k ? "bg-accent text-accent-fg" : "text-fg")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "live" ? live : podium}
    </div>
  );
}
