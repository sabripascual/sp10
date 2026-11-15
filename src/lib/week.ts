// Semanas de lunes a domingo sobre fechas yyyy-MM-dd (sin zona horaria).
import { shiftDate } from "@/lib/fast";

/** 1 = lunes ... 7 = domingo */
export function isoDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function weekStart(date: string) {
  return shiftDate(date, 1 - isoDay(date));
}

export function weekDates(date: string) {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
}

export const DAY_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function dayName(date: string) {
  return DAY_LONG[isoDay(date) - 1];
}

export function shortDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return `${dayName(date)} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}
