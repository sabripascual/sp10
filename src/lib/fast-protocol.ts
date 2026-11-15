// Protocolos de ayuno (12:12, 16:8, ...). Sin "use client": se usa en server y cliente.

/** Protocolos de ayuno: horas de ayuno → etiqueta. */
export const PROTOCOLS = [
  { hours: 12, label: "12:12", hint: "Suave" },
  { hours: 14, label: "14:10", hint: "Intermedio" },
  { hours: 16, label: "16:8", hint: "Clásico" },
  { hours: 18, label: "18:6", hint: "Exigente" },
  { hours: 20, label: "20:4", hint: "Guerrera" },
  { hours: 23, label: "23:1", hint: "Una comida" },
];

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toTime = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export function fastHours(start: string, end: string) {
  let d = toMin(end) - toMin(start);
  if (d <= 0) d += 1440;
  return d / 60;
}

export function protocolLabel(start: string, end: string) {
  const h = fastHours(start, end);
  const p = PROTOCOLS.find((x) => x.hours === h);
  return p ? p.label : `${Math.round(h * 10) / 10} h`;
}

