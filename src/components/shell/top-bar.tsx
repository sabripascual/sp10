import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { RingoMark } from "@/components/brand/ringo-logo";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-[-0.04em] text-[#fdd111]">
          <RingoMark className="h-8 w-auto" />
          Ringo
        </Link>
        <div className="flex gap-2">
          <Link
            href="/ajustes#avisos"
            aria-label="Avisos"
            className="grid size-10 place-items-center rounded-full bg-surface text-fg"
          >
            <Bell className="size-5" />
          </Link>
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className="grid size-10 place-items-center rounded-full bg-surface text-fg"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
