import { formatInTimeZone } from "date-fns-tz";

const pad = (n: number) => String(n).padStart(2, "0");

export function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function humanDuration(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

export function hour(iso: string, tz: string) {
  return formatInTimeZone(new Date(iso), tz, "HH:mm");
}
