// Etapas del ayuno según el tiempo transcurrido (aproximadas: varían en cada cuerpo).

export type FastStage = { fromH: number; emoji: string; name: string; text: string };

export const FAST_STAGES: FastStage[] = [
  { fromH: 0, emoji: "🍽️", name: "Digestión", text: "Tu cuerpo procesa la última comida." },
  { fromH: 4, emoji: "📉", name: "Azúcar estable", text: "Baja la insulina y el azúcar se acomoda." },
  { fromH: 8, emoji: "🔋", name: "Usando reservas", text: "Empieza a tirar del glucógeno guardado." },
  { fromH: 12, emoji: "🔥", name: "Modo quemagrasa", text: "Empezás a usar grasa como energía." },
  { fromH: 16, emoji: "💪", name: "Cetosis", text: "Sube la quema de grasa. ¡Esto es lo que buscábamos!" },
  { fromH: 18, emoji: "✨", name: "Autofagia", text: "Arranca la limpieza celular. Nivel pro." },
  { fromH: 24, emoji: "🧘", name: "Nivel monje", text: "Un día entero. Respeto total." },
];

/** Etapa actual, la siguiente y cuánto falta para llegar (ms). */
export function fastStage(elapsedMs: number) {
  const h = Math.max(0, elapsedMs) / 3_600_000;
  let i = 0;
  while (i + 1 < FAST_STAGES.length && h >= FAST_STAGES[i + 1].fromH) i++;
  const next = FAST_STAGES[i + 1] ?? null;
  return {
    index: i,
    current: FAST_STAGES[i],
    next,
    msToNext: next ? next.fromH * 3_600_000 - Math.max(0, elapsedMs) : null,
  };
}
