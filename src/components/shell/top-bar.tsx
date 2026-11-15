import Link from "next/link";
import { Settings } from "lucide-react";
import { CatLogo } from "@/components/brand/cat-logo";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-1.5 text-2xl font-black tracking-[-0.06em]">
          <CatLogo className="size-9" />
          SP10
        </Link>
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="grid size-10 place-items-center rounded-full bg-surface text-fg"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </header>
  );
}
