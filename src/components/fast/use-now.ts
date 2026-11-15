"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Reloj que late cada segundo y refresca los datos al cruzar un límite. */
export function useNow(initialISO: string, boundaries: string[]) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date(initialISO).getTime());
  const key = boundaries.join("|");

  useEffect(() => {
    const limits = key.split("|").map((b) => new Date(b).getTime());
    let refreshed = false;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (!refreshed && limits.some((l) => t >= l && new Date(initialISO).getTime() < l)) {
        refreshed = true;
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [key, initialISO, router]);

  return now;
}
