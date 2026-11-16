// Banco de frases por aviso. {apodo} / {Apodo} se reemplazan por un apodo al azar.
// Reglas de tono: nunca culpa ni vergüenza; ningún aviso menciona el peso como número.

export type NotifyKind =
  | "window_closing"
  | "fast_started"
  | "fast_done"
  | "fast_unconfirmed"
  | "strength_pending"
  | "event_tomorrow"
  | "compensation_today"
  | "fast_confirm"
  | "body_check"
  | "weekly_summary";

export const NOTIFY_KINDS: { kind: NotifyKind; label: string; when: string }[] = [
  { kind: "window_closing", label: "Cierre de ventana", when: "30 min antes de la última comida" },
  { kind: "fast_started", label: "Empezá tu ayuno", when: "A la hora de la última comida" },
  { kind: "fast_confirm", label: "¿Ya empezaste?", when: "1 h después, si no lo marcaste" },
  { kind: "fast_done", label: "¿Terminaste o seguís?", when: "A la hora de fin del ayuno" },
  { kind: "fast_unconfirmed", label: "¿A qué hora terminaste?", when: "2 h después, si no contestaste" },
  { kind: "strength_pending", label: "Fierritos pendientes", when: "Jueves y domingo 10:00" },
  { kind: "event_tomorrow", label: "Derrape mañana", when: "Día previo, 10:00" },
  { kind: "compensation_today", label: "Compensación de hoy", when: "Día siguiente, 10:00" },
  { kind: "body_check", label: "Control quincenal", when: "El día que toca, 9:30" },
  { kind: "weekly_summary", label: "Resumen semanal", when: "Domingo 20:00" },
];

export const URLS: Record<NotifyKind, string> = {
  window_closing: "/ayuno",
  fast_started: "/ayuno",
  fast_done: "/ayuno",
  fast_unconfirmed: "/ayuno",
  strength_pending: "/entrenos",
  event_tomorrow: "/",
  compensation_today: "/",
  fast_confirm: "/ayuno",
  body_check: "/cuerpo/control",
  weekly_summary: "/progreso",
};

export const PHRASES: Record<NotifyKind, string[]> = {
  window_closing: [
    "{Apodo}, metéle a la última comida que en media hora se te cierra la ventana",
    "{Apodo}, metéle a la última comida que se te acaba la ventana",
    "Media hora de ventana, {apodo}. Cerrá con algo rico",
  ],
  fast_started: [
    "{Apodo}, no te olvides de empezar el ayuno. Tocá Empezar y largamos",
    "Hora de cerrar la ventana, {apodo}. Marcá Empezar y nos vemos a las {fin}",
    "{Apodo}, la racha no se cuida sola: dale a Empezar el ayuno",
  ],
  fast_confirm: [
    "{Apodo}, ¿ya empezaste el ayuno? Confirmalo y, si fue antes, ajustá la hora",
    "¿Arrancaste el ayuno, {apodo}? Un toque y lo dejo anotado con tu hora",
  ],
  fast_done: [
    "¡{horas} horas, {apodo}! ¿Terminaste o seguís? Contame y lo anoto",
    "{Apodo}, llegaste a la meta de {horas} h 💪 ¿Cortás acá o lo estirás?",
    "¡Meta cumplida, {apodo}! Tocá y decime si terminaste o seguís",
  ],
  fast_unconfirmed: [
    "{Apodo}, ¿seguís ayunando? Si ya comiste, decime a qué hora y lo dejo anotado",
    "¿A qué hora cortaste el ayuno, {apodo}? Un toque y queda con tus horas reales",
  ],
  strength_pending: [
    "{Apodo}, vas {hechas} de {meta} en fierritos y ya es {dia}. Hora de meterle fierro",
    "{Apodo}, el gym te extraña. No lo hagas sufrir",
    "{Apodo}, hoy no se negocia: fierritos y a otra cosa",
    "{Apodo}, hora de meterle fierro",
  ],
  event_tomorrow: [
    "Mañana se viene {evento}, {apodo}. Hoy metéle fierritos y derrapás tranqui",
    "{Apodo}, mañana es {evento}. ¿Unos fierritos hoy para llegar con todo?",
  ],
  compensation_today: [
    "Ayer hubo derrape, hoy le devolvemos al cuerpo. Vos podés, {apodo}",
    "{Apodo}, hoy compensamos lo de {evento}. Un toque y queda la marca",
  ],
  body_check: [
    "Toca control, {apodo}. Es solo un dato, no un juicio",
    "{Apodo}, hoy es día de control. Medidas, fotos y listo",
  ],
  weekly_summary: [
    "Semana cerrada, {apodo}: {resumen}. Sos una máquina",
    "{Apodo}, así cerró la semana: {resumen}. ¡A la próxima con todo!",
  ],
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Elige frase (sin repetir la última) y apodo, y completa las variables. */
export function buildMessage(
  kind: NotifyKind,
  vars: Record<string, string | number>,
  nicknames: string[],
  lastPhraseId: number | null,
  rand: () => number = Math.random,
) {
  const bank = PHRASES[kind];
  let ids = bank.map((_, i) => i);
  if (bank.length > 1 && lastPhraseId !== null) ids = ids.filter((i) => i !== lastPhraseId);
  const phraseId = ids[Math.floor(rand() * ids.length)];
  const names = nicknames.length ? nicknames : ["crack"];
  const apodo = names[Math.floor(rand() * names.length)];
  let body = bank[phraseId].replaceAll("{apodo}", apodo).replaceAll("{Apodo}", cap(apodo));
  for (const [k, v] of Object.entries(vars)) body = body.replaceAll(`{${k}}`, String(v));
  return { phraseId, body };
}
