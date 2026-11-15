"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { Chips } from "@/components/training/chips";
import { MEASURES, fmt, type BodyCheck, type Measure } from "@/lib/body";

// Una serie por gráfico, en el amarillo de la marca; grilla y ejes recesivos.
const ACCENT = "var(--accent)";
const GRID = "rgba(255,255,255,0.08)";
const TICK = { fill: "var(--muted)", fontSize: 11 };

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;

function Tip({ active, payload, unit, hideValue }: Partial<TooltipContentProps<number, string>> & { unit: string; hideValue?: boolean }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const row = p.payload as { label: string; value: number; tip?: string };
  return (
    <div className="rounded-xl bg-bg px-3 py-2 text-xs shadow-lg ring-1 ring-muted/40">
      <p className="text-muted">{row.label}</p>
      <p className="text-sm font-black text-fg">{hideValue ? (row.tip ?? "") : `${fmt(Number(p.value))} ${unit}`}</p>
    </div>
  );
}

/** Minutos corridos por semana (barras). */
export function RunChart({ weeks }: { weeks: { weekStart: string; runMinutes: number }[] }) {
  const data = weeks.map((w) => ({ label: `Semana del ${dm(w.weekStart)}`, x: dm(w.weekStart), value: w.runMinutes }));
  if (data.every((d) => d.value === 0)) return <Empty text="Cuando registres trotes, acá ves los minutos por semana." />;
  return (
    <div className="h-48" role="img" aria-label="Minutos corridos por semana">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap={6}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="x" tick={TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.06)" }} content={<Tip unit="min" />} />
          <Bar dataKey="value" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineSeries({ data, unit, hideValues }: { data: { x: string; label: string; value: number; tip?: string }[]; unit: string; hideValues?: boolean }) {
  // Escala en números enteros, con un poco de aire arriba y abajo.
  const values = data.map((d) => d.value);
  const lo = Math.floor(Math.min(...values) - 0.5);
  const hi = Math.ceil(Math.max(...values) + 0.5);
  return (
    <div className="h-48" role="img" aria-label="Evolución">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: hideValues ? -52 : -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="x" tick={TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis
            tick={hideValues ? false : TICK}
            tickLine={false}
            axisLine={false}
            domain={[lo, hi]}
            allowDecimals={false}
            tickFormatter={(v: number) => fmt(v)}
          />
          <Tooltip cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} content={<Tip unit={unit} hideValue={hideValues} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={ACCENT}
            strokeWidth={2}
            dot={{ r: 4, fill: ACCENT, stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: ACCENT, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Medidas en el tiempo: una medida a la vez, elegida con chips. */
export function MeasuresChart({ checks }: { checks: BodyCheck[] }) {
  const available = MEASURES.filter((m) => checks.filter((c) => c[m.key] !== null).length >= 1);
  const [key, setKey] = useState<Measure>(available[0]?.key ?? "waist_cm");
  if (available.length === 0) return <Empty text="Con tus controles aparece la evolución de cada medida." />;
  const data = checks
    .filter((c) => c[key] !== null)
    .map((c) => ({ x: dm(c.date), label: dm(c.date), value: Number(c[key]) }));
  return (
    <div className="space-y-3">
      <Chips cols={3} value={key} onChange={setKey} options={available.map((m) => ({ value: m.key, label: m.label }))} />
      {data.length < 2 ? <Empty text="Con el próximo control ves la línea." /> : <LineSeries data={data} unit="cm" />}
    </div>
  );
}

/**
 * Tendencia de peso: promedio móvil de los últimos 3 controles.
 * Con "número oculto" no hay escala ni números: solo la forma de la curva.
 */
export function WeightChart({ checks, hidden }: { checks: BodyCheck[]; hidden: boolean }) {
  const w = checks.filter((c) => c.weight_kg !== null).map((c) => ({ date: c.date, kg: Number(c.weight_kg) }));
  if (w.length < 2) return <Empty text="Con dos controles con peso aparece la tendencia." />;
  const data = w.map((p, i) => {
    const avg = Math.round(movingAvg(w, i) * 10) / 10;
    const prev = i > 0 ? movingAvg(w, i - 1) : avg;
    const tip = avg < prev - 0.3 ? "↓ Bajando" : avg > prev + 0.3 ? "↑ Subiendo" : "→ Estable";
    return { x: dm(p.date), label: dm(p.date), value: avg, tip };
  });
  return <LineSeries data={data} unit="kg" hideValues={hidden} />;
}

/** Promedio de los últimos 3 controles hasta el i-ésimo. */
function movingAvg(w: { kg: number }[], i: number) {
  const slice = w.slice(Math.max(0, i - 2), i + 1);
  return slice.reduce((a, b) => a + b.kg, 0) / slice.length;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-bg p-4 text-sm text-muted">{text}</p>;
}
