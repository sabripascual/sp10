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
  | "weekly_summary"
  // Avisos del coach: los maneja solo el admin (Panel Ringo), no se ven en Ajustes
  | "level_result"
  | "forecast"
  | "streak_milestone"
  | "idle";

export type CoachKind = "level_result" | "forecast" | "streak_milestone" | "idle";

/** Avisos generales: prendidos o apagados para todas desde el Panel Ringo. */
export const COACH_KINDS: { kind: CoachKind; label: string; when: string }[] = [
  { kind: "level_result", label: "Salió tu nivel", when: "Lunes 9:30: perrita de la semana, si subió o bajó y puesto en el Club" },
  { kind: "forecast", label: "Pronóstico", when: "Miércoles 13:00: si seguís así cerrás perrita…" },
  { kind: "streak_milestone", label: "Hitos de racha", when: "12:00, al llegar a 7/14/30/60/100 días de ayuno o 4/8/12 semanas de fierritos" },
  { kind: "idle", label: "¿Dónde andás?", when: "18:00, con 3 días sin anotar nada (máx. 1 por semana)" },
];

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
  level_result: "/club",
  forecast: "/",
  streak_milestone: "/progreso",
  idle: "/",
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
  // Los del coach arman la frase con {linea} (elegida según el caso en coach-notify.ts)
  level_result: ["{emoji} {linea}{cambio}{puesto}"],
  forecast: ["🔮 {linea}"],
  streak_milestone: ["{linea}"],
  idle: [
    "Hola, {apodo} perdida 👀 No se te cae una anotación en Ringo esta semana. No te reto, solo quiero saber si estás viva o te tragó la cama 🛏️",
  ],
};

/** Línea principal del "Salió tu nivel", según la perrita. {pts} = puntos. */
export const LEVEL_LINES: Record<string, string[]> = {
  dios: ["{Apodo}, cerraste la semana nivel DIOS con {pts} pts. ¿Te pedimos un autógrafo?", "Nivel dios, {apodo}: {pts} pts. Sos inalcanzable."],
  crack: ["Perrita crack, {apodo}: {pts} pts. Ni el Dibu ataja tanta constancia.", "{Apodo}, semana de crack: {pts} pts. Así da gusto."],
  motivada: ["{Apodo}, saliste perrita motivada con {pts} pts. Un empujoncito más y te codeás con las cracks."],
  promedio: ["Perrita promedio de la humanidad, {apodo} ({pts} pts). Ni fu ni fa… ¿esta semana la rompemos?"],
  vagoneta: ["{Apodo}, la semana pasada saliste perrita vagoneta. El sillón te quiere, pero el lunes es tuyo."],
  pajera: ["Perrita pajera, {apodo}. Pasa en las mejores familias: hoy arrancamos de cero 🐶"],
};

/** Pronóstico de mitad de semana. {nivel} {emoji} {pct} {falta}. */
export const FORECAST_LINES = {
  done: ["{Apodo}, ya cumpliste tu semana ideal y es miércoles. Lo que venga es de yapa 👑"],
  up: [
    "Pronóstico Ringo: si seguís así, {apodo}, cerrás la semana perrita {nivel} {emoji}. Que no se te suba a la cabeza 😏",
    "{Apodo}, vas {pct}% y es miércoles. A este ritmo te van a pedir doping",
  ],
  mid: [
    "{Apodo}, vas {pct}%: si mantenés, cerrás perrita {nivel} {emoji}. Con {falta} te asegurás subir",
    "Mitad de semana, {apodo}. Venís bien, pero el nivel dios no se regala: te falta {falta}",
  ],
  down: [
    "El pronóstico dice perrita {nivel} {emoji}… pero los pronósticos se equivocan, {apodo}. Te falta {falta} y quedan 4 días",
    "{Apodo}, miércoles y {pct}%. Tranqui, Argentina remontó peores. {falta} y das vuelta el partido ⚽",
  ],
};

export const MILESTONE_LINES = {
  ayuno: [
    "🔥 ¡{n} días de ayuno seguidos, {apodo}! Esto ya es un estilo de vida",
    "🔥 {Apodo}, {n} días seguidos de ayuno. La racha está on fire y vos también",
  ],
  fierritos: [
    "💪🏻 {n} semanas seguidas cumpliendo los fierritos. {Apodo}, los brazos ya se enteraron",
    "💪🏻 {Apodo}, {n} semanas seguidas de fierritos. El gym ya te pone en la foto de la entrada",
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
  // Primero las variables (pueden traer {apodo} adentro, como {linea}) y después el apodo
  let body = bank[phraseId];
  for (const [k, v] of Object.entries(vars)) body = body.replaceAll(`{${k}}`, String(v));
  body = body.replaceAll("{apodo}", apodo).replaceAll("{Apodo}", cap(apodo));
  return { phraseId, body };
}
