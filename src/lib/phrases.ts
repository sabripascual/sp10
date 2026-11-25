// Banco de frases por aviso. {apodo} / {Apodo} se reemplazan por un apodo al azar.
// Reglas de tono: nunca culpa ni vergüenza; ningún aviso menciona el peso como número.

export type NotifyKind =
  | "window_closing"
  | "fast_started"
  | "fast_done"
  | "fast_unconfirmed"
  | "week_goals"
  | "event_tomorrow"
  | "compensation_today"
  | "compensation_last"
  | "fast_confirm"
  | "body_check"
  | "weekly_summary";

export const NOTIFY_KINDS: { kind: NotifyKind; label: string; when: string }[] = [
  { kind: "window_closing", label: "Cierre de ventana", when: "30 min antes de la última comida" },
  { kind: "fast_started", label: "Empezá tu ayuno", when: "A la hora de la última comida" },
  { kind: "fast_confirm", label: "¿Ya empezaste?", when: "1 h después, si no lo marcaste" },
  { kind: "fast_done", label: "¿Terminaste o seguís?", when: "A la hora de fin del ayuno" },
  { kind: "fast_unconfirmed", label: "¿A qué hora terminaste?", when: "2 h después, si no contestaste" },
  { kind: "week_goals", label: "Cómo va tu semana", when: "Jueves y domingo 10:00, si falta algo" },
  { kind: "event_tomorrow", label: "Derrape mañana", when: "Día previo, 10:00" },
  { kind: "compensation_today", label: "Compensación de hoy", when: "Día siguiente, 10:00" },
  { kind: "compensation_last", label: "Último día para compensar", when: "Domingo 10:00, si quedó un derrape" },
  { kind: "body_check", label: "Control quincenal", when: "El día que toca, 9:30" },
  { kind: "weekly_summary", label: "Resumen semanal", when: "Domingo 20:00" },
];

/** Avisos que solo tienen sentido si hace ayuno. */
export const FAST_KINDS: NotifyKind[] = ["window_closing", "fast_started", "fast_confirm", "fast_done", "fast_unconfirmed"];

export const URLS: Record<NotifyKind, string> = {
  window_closing: "/ayuno",
  fast_started: "/ayuno",
  fast_done: "/ayuno",
  fast_unconfirmed: "/ayuno",
  week_goals: "/",
  event_tomorrow: "/",
  compensation_today: "/",
  compensation_last: "/",
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
  week_goals: [
    "{Apodo}, vas {pct}% de tu semana y ya es {dia}. Te falta: {falta}. ¡Vamos que se puede!",
    "{Apodo}, tu semana va al {pct}%. Para completarla: {falta}",
    "Ya es {dia}, {apodo}: {pct}% de tu semana ideal. Falta {falta} y sos una máquina",
    "{Apodo}, ni el Dibu ataja tanta constancia: vas {pct}%. Te queda {falta}",
  ],
  event_tomorrow: [
    "Mañana se viene {evento}, {apodo}. Hoy metéle fierritos y derrapás tranqui",
    "{Apodo}, mañana es {evento}. ¿Unos fierritos hoy para llegar con todo?",
  ],
  compensation_today: [
    "Ayer hubo derrape, hoy le devolvemos al cuerpo. Vos podés, {apodo}",
    "{Apodo}, hoy compensamos lo de {evento}. Un toque y queda la marca",
  ],
  compensation_last: [
    "{Apodo}, hoy cierra la semana: último día para compensar {evento}. Un entrenito y queda la marca",
    "Domingo, {apodo}: si compensás {evento} hoy, la semana cierra redonda",
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
