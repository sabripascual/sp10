import Image from "next/image";

/** Firma de BRAVE al pie: isotipo + nombre. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 flex flex-col items-center gap-1.5 pb-2 text-center">
      <span className="flex items-center gap-1.5">
        <Image src="/brave-logo.png" alt="" width={22} height={27} className="h-[27px] w-auto" />
        <span className="text-sm font-black tracking-[-0.06em] text-fg/70">BRAVE</span>
      </span>
      <span className="text-[11px] text-muted">© {year} BRAVE. Todos los derechos reservados.</span>
    </footer>
  );
}
