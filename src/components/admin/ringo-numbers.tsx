import { LEVELS, type LevelKey } from "@/lib/level";
import type { getRingoNumbers } from "@/lib/ringo-numbers";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

type Data = Awaited<ReturnType<typeof getRingoNumbers>>;
const emoji = (k: LevelKey | null) => (k ? LEVELS.find((l) => l.key === k)!.emoji : "—");
const comma = (n: number) => String(n).replace(".", ",");
const dm = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;

function Bar({ label, pct, note }: { label: string; pct: number; note?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold">{label}</span>
        <span className="font-black tabular-nums">
          {pct}%{note && <span className="ml-1 font-normal text-muted">· {note}</span>}
        </span>
      </div>
      <span className="block h-2 overflow-hidden rounded-full bg-bg">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

const pctCell = (v: number | null) => (v === null ? "—" : `${v}%`);

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-[11px] font-bold leading-tight text-muted">{label}</p>
    </div>
  );
}

/** "Ringo en números": uso, frecuencia, clubes, ranking general y tendencia. Solo admin. */
export function RingoNumbers({ d }: { d: Data }) {
  const maxFreq = Math.max(1, ...Object.values(d.frequency.buckets));
  const maxLevel = Math.max(1, ...Object.values(d.levelCounts));
  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5">
      <div>
        <p className="text-lg font-bold">📊 Ringo en números</p>
        <p className="text-xs text-muted">Solo uso y constancia. Nada de pesos, medidas ni fotos.</p>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Stat value={d.users.total} label="usuarias" />
        <Stat value={d.users.active7} label="activas 7 días" />
        <Stat value={d.users.active30} label="activas 30 días" />
        <Stat value={d.users.pending} label="por aprobar" />
      </div>
      {/* 1. En riesgo */}
      <div className="space-y-2">
        <p className="text-sm font-bold">
          ⚠️ En riesgo de abandonar <span className="font-normal text-muted">· 7 días o más sin anotar nada</span>
        </p>
        {d.atRisk.length === 0 ? (
          <p className="text-xs text-muted">Nadie: todas vienen anotando 🙌</p>
        ) : (
          <ul className="divide-y divide-muted/30">
            {d.atRisk.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{r.name}</span>
                  <span className="block text-xs text-muted">{r.since === null ? "Nunca anotó nada" : `Hace ${r.since} días`}</span>
                </span>
                {r.whatsapp ? (
                  <a
                    href={waLink(r.whatsapp, `¡Hola ${r.name.split(" ")[0]}! 🐶 Te extrañamos en Ringo. ¿Cómo venís con tu semana ideal? Un toque y volvés a sumar 💪🏻`)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-black text-accent-fg"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="shrink-0 text-[11px] text-muted">sin WhatsApp</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. Retención */}
      {d.cohorts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold">
            Retención <span className="font-normal text-muted">· de las que entraron cada semana, % activas después</span>
          </p>
          <table className="w-full text-xs tabular-nums">
            <thead className="text-muted">
              <tr>
                <th className="py-1 text-left font-bold">Entraron</th>
                <th className="font-bold">Cuántas</th>
                <th className="font-bold">Sem 1</th>
                <th className="font-bold">Sem 2</th>
                <th className="font-bold">Sem 4</th>
              </tr>
            </thead>
            <tbody>
              {d.cohorts.map((c) => (
                <tr key={c.weekStart} className="border-t border-muted/30 text-center">
                  <td className="py-1.5 text-left font-bold">{dm(c.weekStart)}</td>
                  <td>{c.n}</td>
                  <td>{pctCell(c.w1)}</td>
                  <td>{pctCell(c.w2)}</td>
                  <td>{pctCell(c.w4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Activación */}
      <div className="space-y-2">
        <p className="text-sm font-bold">
          Activación <span className="font-normal text-muted">· qué completaron</span>
        </p>
        {d.activation.map((a) => (
          <Bar key={a.key} label={a.label} pct={a.pct} />
        ))}
      </div>

      {/* 4. Uso por función */}
      <div className="space-y-2">
        <p className="text-sm font-bold">
          Uso por función <span className="font-normal text-muted">· últimos 28 días</span>
        </p>
        {d.features.map((f) => (
          <Bar key={f.key} label={f.label} pct={f.pct} note={"note" in f ? f.note : undefined} />
        ))}
      </div>

      <p className="text-xs text-muted">
        Nuevas por semana: {d.users.newByWeek.map((w) => `${dm(w.weekStart)} → ${w.n}`).join(" · ")}
      </p>

      <div className="space-y-2">
        <p className="text-sm font-bold">
          Frecuencia de uso <span className="font-normal text-muted">· promedio {comma(d.frequency.avgDays)} días por semana</span>
        </p>
        {Object.entries(d.frequency.buckets).map(([k, n]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 font-bold">{k === "0" ? "Sin uso" : `${k} días`}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${(n / maxFreq) * 100}%` }} />
            </span>
            <span className="w-6 text-right font-black tabular-nums">{n}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Nivel promedio por semana</p>
        <div className="flex h-24 items-end gap-1.5">
          {d.trend.map((t) => (
            <div key={t.weekStart} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-black tabular-nums">{t.avg ?? "—"}</span>
              <span className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(4, ((t.avg ?? 0) / 100) * 64)}px`, opacity: t.avg === null ? 0.2 : 1 }} />
              <span className="text-[9px] text-muted">{dm(t.weekStart)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">¿En qué nivel están? <span className="font-normal text-muted">· semana pasada</span></p>
        <div className="grid grid-cols-6 gap-1.5">
          {[...LEVELS].reverse().map((l) => (
            <div key={l.key} className="flex flex-col items-center gap-1 rounded-xl bg-bg py-2">
              <span className="text-xl">{l.emoji}</span>
              <span className="text-sm font-black tabular-nums" style={{ opacity: 0.4 + (d.levelCounts[l.key] / maxLevel) * 0.6 }}>
                {d.levelCounts[l.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Clubes ({d.clubs.length})</p>
        {d.clubs.length === 0 ? (
          <p className="text-xs text-muted">Todavía no hay clubes.</p>
        ) : (
          <ul className="divide-y divide-muted/30">
            {d.clubs.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{c.name}</span>
                  <span className="block truncate text-xs text-muted">
                    Dueña: {c.owner} · {c.members} miembros{c.winner ? ` · ganó ${c.winner}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs font-black">
                  {emoji(c.avgLevel)} {c.avg ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Ranking general <span className="font-normal text-muted">· todas, semana pasada</span></p>
        {d.ranking.length === 0 ? (
          <p className="text-xs text-muted">Todavía nadie cerró una semana completa.</p>
        ) : (
          <ol className="space-y-1">
            {d.ranking.map((r, i) => (
              <li key={r.id} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm", i < 3 ? "bg-bg" : "")}>
                <span className="w-6 text-center font-black tabular-nums">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <span className="text-lg">{emoji(r.level)}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{r.name}</span>
                <span className="shrink-0 text-[11px] text-muted">
                  {comma(r.daysPerWeek)} d/sem{r.streak > 1 ? ` · 🔥${r.streak}` : ""}
                </span>
                <span className="w-8 shrink-0 text-right font-black tabular-nums">{r.score}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="text-[11px] text-muted">d/sem = días por semana con algún registro (últimas 4). 🔥 = semanas seguidas en motivada o más.</p>
      </div>
    </div>
  );
}
