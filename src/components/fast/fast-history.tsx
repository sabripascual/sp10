import { formatInTimeZone } from "date-fns-tz";
import type { DayMark } from "@/lib/fast";
import { shortDate } from "@/lib/week";

const MARK: Partial<Record<DayMark, string>> = { ok: "✅", extended: "💪", event: "😈", broken: "✂️" };

const hm = (iso: string, tz: string) => formatInTimeZone(new Date(iso), tz, "HH:mm");
const fmtH = (h: number) => `${String(h).replace(".", ",")} h`;

/** Últimos ayunos con sus horas: reales si los marcaste, si no según tu horario. */
export function FastHistory({
  items,
  timezone,
}: {
  items: { date: string; startISO: string; endISO: string; hours: number; mark: DayMark; confirmed: boolean }[];
  timezone: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted">Acá van a aparecer tus ayunos con sus horas.</p>;
  return (
    <ul className="divide-y divide-muted/30">
      {items.map((it) => (
        <li key={it.date} className="flex items-center gap-3 py-2.5">
          <span className="text-lg">{MARK[it.mark] ?? "✅"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{shortDate(it.date)}</p>
            <p className="text-xs text-muted">
              {hm(it.startISO, timezone)} → {hm(it.endISO, timezone)}
              {!it.confirmed && " · según horario"}
            </p>
          </div>
          <span className="text-lg font-black tabular-nums">{fmtH(it.hours)}</span>
        </li>
      ))}
    </ul>
  );
}
