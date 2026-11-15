// Banco de frases por aviso. {apodo} / {Apodo} se reemplazan por un apodo al azar.
// Reglas de tono: nunca culpa ni vergüenza; ningún aviso menciona el peso como número.

export type NotifyKind =
  | "window_closing"
  | "fast_started"
  | "fast_done"
  | "strength_pending"
  | "event_tomorrow"
  | "compensation_today"
  | "confirm_futbol"
  | "body_check"
  | "weekly_summary";

export const NOTIFY_KINDS: { kind: NotifyKind; label: string; when: string }[] = [
  { kind: "window_closing", label: "Cierre de ventana", when: "30 min antes de la última comida" },
  { kind: "fast_started", label: "Ayuno iniciado", when: "A la hora de la última comida" },
  { kind: "fast_done", label: "Ayuno cumplido", when: "Cuando termina el ayuno" },
  { kind: "strength_pending", label: "Fuerza pendiente", when: "Jueves y domingo 10:00" },
  { kind: "event_tomorrow", label: "Evento mañana", when: "Día previo, 10:00" },
  { kind: "compensation_today", label: "Compensación de hoy", when: "Día siguiente, 10:00" },
  { kind: "confirm_futbol", label: "Confirmar fútbol", when: "Días de fútbol, 22:00" },
  { kind: "body_check", label: "Control quincenal", when: "El día que toca, 9:30" },
  { kind: "weekly_summary", label: "Resumen semanal", when: "Domingo 20:00" },
];

export const URLS: Record<NotifyKind, string> = {
  window_closing: "/ayuno",
  fast_started: "/ayuno",
  fast_done: "/ayuno",
  strength_pending: "/entrenos",
  event_tomorrow: "/",
  compensation_today: "/",
  confirm_futbol: "/",
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
    "Arrancó el ayuno, {apodo}. Nos vemos a las {fin} con todo",
    "{Apodo}, ventana cerrada. A las {fin} desayunás como reina",
    "{Apodo}, la racha no se cuida sola. Arrancó el ayuno",
  ],
  fast_done: [
    "¡{horas} horas, {apodo}! Ya podés desayunar como la campeona que sos",
    "{Apodo}, ayuno cumplido. Ni el Dibu ataja tanta constancia",
    "¡Listo, {apodo}! {horas} horas al hilo. A comer rico",
  ],
  strength_pending: [
    "{Apodo}, vas {hechas} de {meta} en fuerza y ya es {dia}. Hora de meterle fierro",
    "{Apodo}, el gym te extraña. No lo hagas sufrir",
    "{Apodo}, hoy no se negocia: fuerza y a otra cosa",
    "{Apodo}, hora de meterle fierro",
  ],
  event_tomorrow: [
    "Mañana hay {evento}, {apodo}. Hoy metéle fuerza y lo disfrutás tranqui",
    "{Apodo}, mañana es {evento}. ¿Un entreno hoy para llegar con todo?",
  ],
  compensation_today: [
    "Ayer fue fiesta, hoy toca devolverle al cuerpo. Vos podés, {apodo}",
    "{Apodo}, hoy compensamos lo de {evento}. Un toque y queda la marca",
  ],
  confirm_futbol: [
    "{Apodo}, ¿hubo fútbol hoy? Tocame y lo anoto",
    "{Apodo}, ¿cómo estuvo la pelota? Confirmalo con un toque",
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
