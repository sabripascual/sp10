// Lógica pura del cuerpo: próximo control, tendencia y diferencias.
import { shiftDate } from "@/lib/fast";

export const CHECK_EVERY_DAYS = 14;

export type Measure = "waist_cm" | "hip_cm" | "chest_cm" | "arm_cm" | "thigh_cm";
export const MEASURES: { key: Measure; label: string }[] = [
  { key: "waist_cm", label: "Cintura" },
  { key: "hip_cm", label: "Cadera" },
  { key: "chest_cm", label: "Pecho" },
  { key: "arm_cm", label: "Brazo" },
  { key: "thigh_cm", label: "Pierna" },
];

export type Angle = "front" | "side" | "back";
export const ANGLES: { key: Angle; label: string }[] = [
  { key: "front", label: "Frente" },
  { key: "side", label: "Perfil" },
  { key: "back", label: "Espalda" },
];

export type BodyCheck = {
  id: string;
  date: string;
  weight_kg: number | null;
  note: string | null;
} & Record<Measure, number | null>;

/** Próximo control: 14 días después del último, o la fecha del primero. */
export function nextCheckDate(checks: Pick<BodyCheck, "date">[], start: string | null, today: string) {
  const last = checks.map((c) => c.date).sort().at(-1);
  if (last) return shiftDate(last, CHECK_EVERY_DAYS);
  return start ?? today;
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

export type Trend = "bajando" | "estable" | "subiendo";

/**
 * Tendencia del peso: el último control contra el promedio de los anteriores
 * (hasta 3), con ±0,3 kg de margen para no marcar ruido.
 */
export function weightTrend(checks: Pick<BodyCheck, "date" | "weight_kg">[]): Trend | null {
  const w = checks
    .filter((c) => c.weight_kg !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => Number(c.weight_kg));
  if (w.length < 2) return null;
  const last = w.at(-1)!;
  const prev = w.slice(-4, -1);
  const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
  const diff = last - avg;
  return diff < -0.3 ? "bajando" : diff > 0.3 ? "subiendo" : "estable";
}

/** Diferencia de cada medida contra el control anterior que la tenga. */
export function measureDeltas(checks: BodyCheck[], current: BodyCheck) {
  const before = checks.filter((c) => c.date < current.date).sort((a, b) => b.date.localeCompare(a.date));
  return MEASURES.map(({ key, label }) => {
    const now = current[key] === null ? null : Number(current[key]);
    const prevCheck = before.find((c) => c[key] !== null);
    const prev = prevCheck ? Number(prevCheck[key]) : null;
    return { key, label, now, prev, delta: now !== null && prev !== null ? Math.round((now - prev) * 10) / 10 : null };
  });
}

/** 78.5 → "78,5" */
export function fmt(n: number) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}
