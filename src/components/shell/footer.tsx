/** Firma de BRAVE al pie. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 flex flex-col items-center gap-1 pb-2 text-center">
      <span className="text-sm font-black tracking-[-0.06em] text-fg/70">BRAVE</span>
      <span className="text-[11px] text-muted">© {year} BRAVE. Todos los derechos reservados.</span>
    </footer>
  );
}
