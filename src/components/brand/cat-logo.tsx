/** Gatito SP10 (sigue el color del texto). */
export function CatLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">

  <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    {/* pesa */}
    <line x1="96" y1="112" x2="416" y2="112" strokeWidth="18" />
    <rect x="44" y="72" width="36" height="80" rx="10" stroke="none" />
    <rect x="432" y="72" width="36" height="80" rx="10" stroke="none" />
    <rect x="82" y="86" width="20" height="52" rx="6" stroke="none" />
    <rect x="410" y="86" width="20" height="52" rx="6" stroke="none" />
    {/* brazos */}
    <path d="M204 384 L128 116" strokeWidth="28" fill="none" />
    <circle cx="128" cy="112" r="20" stroke="none" />
    <path d="M308 384 L384 116" strokeWidth="28" fill="none" />
    <circle cx="384" cy="112" r="20" stroke="none" />
    {/* orejas */}
    <path d="M164 266 L188 168 L246 220 Z" strokeWidth="16" />
    <path d="M348 266 L324 168 L266 220 Z" strokeWidth="16" />
    {/* cabeza */}
    <ellipse cx="256" cy="300" rx="112" ry="96" stroke="none" />
    {/* cuerpo */}
    <rect x="190" y="356" width="132" height="112" rx="44" stroke="none" />
    {/* cola en espiral (guiño al huracán BRAVE) */}
    <path d="M318 448 C 388 462 440 420 424 376 C 412 344 370 346 368 374 C 366 396 394 402 404 386" strokeWidth="20" fill="none" />
  </g>
  {/* cara */}
  <g fill="none" stroke="var(--bg)" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="214" cy="292" r="15" fill="var(--bg)" stroke="none" />
    <path d="M280 296 Q 298 278 316 296" strokeWidth="11" />
    <path d="M248 316 L264 316 L256 326 Z" fill="var(--bg)" strokeWidth="4" />
    <path d="M232 340 Q 252 356 284 334" strokeWidth="10" />
  </g>

    </svg>
  );
}
