/* eslint-disable @next/next/no-img-element */

/** Ringo: el perrito levantando la barra (amarillo sobre transparente). */
export function RingoMark({ className }: { className?: string }) {
  return <img src="/ringo-mark.png" alt="" aria-hidden="true" className={className} />;
}

/** Logo completo: perrito + "Ringo". */
export function RingoLogo({ className }: { className?: string }) {
  return <img src="/ringo-logo.png" alt="Ringo" className={className} />;
}
