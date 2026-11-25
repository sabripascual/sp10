// WhatsApp: normalizar números (Argentina por defecto) y armar links wa.me.

/**
 * "381 555-1234" → "5493815551234". Acepta con o sin +54 / 9 / 0 / 15.
 * Devuelve null si no parece un número.
 */
export function normalizeWhatsapp(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (!d.startsWith("54")) {
    if (d.startsWith("0")) d = d.slice(1); // 0381… → 381…
    // 381 15 5551234 → 381 5551234 (el 15 local)
    if (d.length === 12 && d.slice(3, 5) === "15") d = d.slice(0, 3) + d.slice(5);
    if (d.length === 12 && d.slice(2, 4) === "15") d = d.slice(0, 2) + d.slice(4);
    if (d.length === 12 && d.slice(4, 6) === "15") d = d.slice(0, 4) + d.slice(6);
    if (d.length === 10) d = "549" + d;
  } else if (d.length === 12) {
    d = "549" + d.slice(2); // 54 381… sin el 9 de celular
  }
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/** Link para abrir WhatsApp con ese número y un mensaje ya escrito. */
export function waLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** "+54 9 381 555-1234" para mostrar. */
export function prettyWhatsapp(n: string | null | undefined) {
  if (!n) return "";
  if (n.startsWith("549") && n.length === 13) return `+54 9 ${n.slice(3, 6)} ${n.slice(6, 9)}-${n.slice(9)}`;
  return `+${n}`;
}
