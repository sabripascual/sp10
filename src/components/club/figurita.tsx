"use client";

import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { LEVELS, type LevelKey } from "@/lib/level";
import { FIGURITA_QUOTES, changeText } from "@/lib/club";
import { cn } from "@/lib/utils";

export type FiguritaData = {
  name: string;
  avatar: string | null;
  number: string;
  level: LevelKey;
  score: number;
  pos: number;
  total: number;
  pct: number;
  prevLevel: LevelKey | null;
  week: string; // "16/11"
};

const GOLD = "#ffd24a";
const YELLOW = "#ffe900";

/** La figurita como se ve en la app. */
export function FiguritaCard({ d }: { d: FiguritaData }) {
  const lvl = LEVELS.find((l) => l.key === d.level)!;
  const gold = d.pos === 1;
  const band = gold ? GOLD : YELLOW;
  return (
    <div
      className="w-[280px] -rotate-[2.5deg] rounded-[22px] p-2 shadow-[0_24px_60px_rgba(255,233,0,0.25)]"
      style={{ background: gold ? "linear-gradient(135deg,#fff3a0,#ffd24a 40%,#b8860b 60%,#fff3a0)" : YELLOW }}
    >
      <div className="overflow-hidden rounded-2xl bg-[#141414]">
        <div className="flex items-center justify-between px-3.5 py-2.5 text-black" style={{ background: band }}>
          <span className="text-xs font-black tracking-[0.08em]">RINGO CLUB {new Date().getFullYear()}</span>
          <span className="text-xs font-black">#{d.number}</span>
        </div>
        <div className="relative grid h-56 place-items-center bg-gradient-to-b from-[#3a3a3a] to-[#1f1f1f]">
          {d.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.avatar} alt="" className="size-36 rounded-full border-4 object-cover" style={{ borderColor: band }} />
          ) : (
            <span className="grid size-36 place-items-center rounded-full border-4 bg-[#5a5a5a] text-6xl" style={{ borderColor: band }}>
              🐶
            </span>
          )}
          <span
            className="absolute right-3 top-3 grid size-12 place-items-center rounded-full border-[3px] bg-black text-2xl"
            style={{ borderColor: band }}
          >
            {lvl.emoji}
          </span>
        </div>
        <div className="space-y-2.5 px-4 pb-4 pt-3.5">
          <div>
            <p className="truncate text-[26px] font-black leading-none">{d.name}</p>
            <p className="mt-1 text-[15px] font-extrabold" style={{ color: band }}>
              {lvl.name}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <Stat v={String(d.score)} l="puntos" />
            <Stat v={`${d.pos}ª`} l={`de ${d.total} en el Club`} />
            <Stat v={`${d.pct}%`} l="semana ideal" />
          </div>
          <p className="text-sm italic leading-snug text-[#e5e5e5]">“{FIGURITA_QUOTES[d.level]}”</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-[10px] bg-black px-1.5 py-2">
      <p className="text-xl font-black leading-tight">{v}</p>
      <p className="text-[10px] font-bold leading-tight text-[#a3a3a3]">{l}</p>
    </div>
  );
}

// ── Imagen para compartir (canvas 1080×1350) ─────────────────────────────
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

async function drawFigurita(d: FiguritaData, withPhoto: boolean): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const f = (weight: number, size: number, italic = false) => `${italic ? "italic " : ""}${weight} ${size}px ${font}`;
  const lvl = LEVELS.find((l) => l.key === d.level)!;
  const gold = d.pos === 1;
  const band = gold ? GOLD : YELLOW;

  // Fondo negro con confeti
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = YELLOW;
  for (const [x, y, s, r] of [[90, 110, 26, 0.3], [960, 180, 22, -0.5], [70, 1040, 24, 0.2], [990, 1120, 30, 0.8], [520, 70, 16, 0.6], [1010, 640, 18, 0.4], [50, 600, 14, 1]])
{
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    ctx.fillRect(-s / 2, -s / 4, s, s / 2);
    ctx.restore();
  }

  // Tarjeta inclinada
  ctx.save();
  ctx.translate(W / 2, H / 2 + 20);
  ctx.rotate(-0.04);
  const cw = 760;
  const ch = 1120;
  const x0 = -cw / 2;
  const y0 = -ch / 2;
  if (gold) {
    const g = ctx.createLinearGradient(x0, y0, x0 + cw, y0 + ch);
    g.addColorStop(0, "#fff3a0");
    g.addColorStop(0.4, GOLD);
    g.addColorStop(0.6, "#b8860b");
    g.addColorStop(1, "#fff3a0");
    ctx.fillStyle = g;
  } else ctx.fillStyle = YELLOW;
  roundRect(ctx, x0, y0, cw, ch, 56);
  ctx.fill();
  const pad = 22;
  ctx.fillStyle = "#141414";
  roundRect(ctx, x0 + pad, y0 + pad, cw - pad * 2, ch - pad * 2, 40);
  ctx.fill();
  ctx.save();
  roundRect(ctx, x0 + pad, y0 + pad, cw - pad * 2, ch - pad * 2, 40);
  ctx.clip();
  // Banda
  ctx.fillStyle = band;
  ctx.fillRect(x0 + pad, y0 + pad, cw - pad * 2, 90);
  ctx.fillStyle = "#000";
  ctx.font = f(900, 36);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(`RINGO CLUB ${new Date().getFullYear()}`, x0 + 60, y0 + pad + 46);
  ctx.textAlign = "right";
  ctx.fillText(`#${d.number}`, x0 + cw - 60, y0 + pad + 46);
  // Zona foto
  const py = y0 + pad + 90;
  const ph = 520;
  const g2 = ctx.createLinearGradient(0, py, 0, py + ph);
  g2.addColorStop(0, "#3a3a3a");
  g2.addColorStop(1, "#1f1f1f");
  ctx.fillStyle = g2;
  ctx.fillRect(x0 + pad, py, cw - pad * 2, ph);
  ctx.restore();
  const cx = 0;
  const cy = py + ph / 2;
  const rad = 190;
  ctx.fillStyle = "#5a5a5a";
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fill();
  let drew = false;
  if (withPhoto && d.avatar) {
    try {
      const img = await loadImage(d.avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - rad, cy - rad, rad * 2, rad * 2);
      ctx.restore();
      drew = true;
    } catch {
      drew = false;
    }
  }
  if (!drew) {
    ctx.font = f(400, 170);
    ctx.textAlign = "center";
    ctx.fillText("🐶", cx, cy + 10);
  }
  ctx.strokeStyle = band;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.stroke();
  // Emoji del nivel
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x0 + cw - 120, py + 90, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.font = f(400, 64);
  ctx.textAlign = "center";
  ctx.fillText(lvl.emoji, x0 + cw - 120, py + 96);
  // Nombre y nivel
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.font = f(900, 76);
  ctx.fillText(d.name, x0 + 64, py + ph + 100);
  ctx.fillStyle = band;
  ctx.font = f(800, 40);
  ctx.fillText(lvl.name, x0 + 64, py + ph + 152);
  // Stats
  const stats: [string, string][] = [
    [String(d.score), "puntos"],
    [`${d.pos}ª`, `de ${d.total} en el Club`],
    [`${d.pct}%`, "semana ideal"],
  ];
  const sw = (cw - 128 - 32) / 3;
  stats.forEach(([v, l], i) => {
    const sx = x0 + 64 + i * (sw + 16);
    const sy = py + ph + 186;
    ctx.fillStyle = "#000";
    roundRect(ctx, sx, sy, sw, 130, 24);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = f(900, 54);
    ctx.fillText(v, sx + sw / 2, sy + 70);
    ctx.fillStyle = "#a3a3a3";
    ctx.font = f(700, 24);
    ctx.fillText(l, sx + sw / 2, sy + 106);
  });
  // Frase
  ctx.textAlign = "left";
  ctx.fillStyle = "#e5e5e5";
  ctx.font = f(700, 34, true);
  const words = `“${FIGURITA_QUOTES[d.level]}”`.split(" ");
  let line = "";
  let ly = py + ph + 380;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > cw - 128) {
      ctx.fillText(line, x0 + 64, ly);
      line = w;
      ly += 46;
    } else line = t;
  }
  ctx.fillText(line, x0 + 64, ly);
  ctx.restore();

  // Pie
  ctx.textAlign = "center";
  ctx.fillStyle = "#a3a3a3";
  ctx.font = f(800, 30);
  ctx.fillText(`Semana del ${d.week} · Ringo 🐶`, W / 2, H - 36);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("sin imagen"))), "image/png"));
}

/** Versión historia de Instagram (1080×1920): la figurita al centro, con aire arriba y abajo para los botones de IG. */
async function drawStory(d: FiguritaData, withPhoto: boolean): Promise<Blob> {
  const card = await createImageBitmap(await drawFigurita(d, withPhoto));
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const f = (weight: number, size: number) => `${weight} ${size}px ${font}`;
  const lvl = LEVELS.find((l) => l.key === d.level)!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = YELLOW;
  ctx.font = f(900, 30);
  ctx.fillText("RINGO CLUB · SEMANA DEL " + d.week, W / 2, 300);
  ctx.fillStyle = "#fff";
  ctx.font = f(900, 72);
  ctx.fillText("Mi figurita de la semana", W / 2, 385);
  // la figurita (ya trae su fondo negro con confeti)
  const cw = 900;
  const ch = (card.height / card.width) * cw;
  ctx.drawImage(card, (W - cw) / 2, 415, cw, ch);
  ctx.fillStyle = "#fff";
  ctx.font = f(900, 46);
  ctx.fillText(`¿Y vos qué perrita sos? ${lvl.emoji}`, W / 2, 415 + ch + 60);
  ctx.fillStyle = "#a3a3a3";
  ctx.font = f(800, 30);
  ctx.fillText("Pedime tu usuario y sumate al Ringo Club 🐶", W / 2, 415 + ch + 112);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("sin imagen"))), "image/png"));
}

/** Botones para mandar la figurita: WhatsApp (formato posteo) e Instagram (formato historia). */
export function ShareFigurita({ d, className }: { d: FiguritaData; className?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusyKind] = useState<"wa" | "ig" | null>(null);
  const share = async (kind: "wa" | "ig") => {
    setBusyKind(kind);
    setMsg(null);
    try {
      const draw = kind === "ig" ? drawStory : drawFigurita;
      let blob: Blob;
      try {
        blob = await draw(d, true);
      } catch {
        blob = await draw(d, false); // la foto no se pudo usar: va con el perrito
      }
      const file = new File([blob], `ringo-figurita${kind === "ig" ? "-historia" : ""}-${d.week.replace("/", "-")}.png`, { type: "image/png" });
      const text = `Salí ${LEVELS.find((l) => l.key === d.level)!.name.toLowerCase()} ${LEVELS.find((l) => l.key === d.level)!.emoji} en el Ringo Club 🐶`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setMsg(kind === "ig" ? "Te la bajé: subila a tu historia desde la galería 📲" : "Te la bajé: mandala desde tu galería 📲");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setMsg("No pude armar la imagen. Probá de nuevo.");
    } finally {
      setBusyKind(null);
    }
  };
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => share("wa")}
        disabled={busy !== null}
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-accent text-lg font-black text-accent-fg active:scale-[0.98] disabled:opacity-60"
      >
        <Share2 className="size-5" strokeWidth={2.75} />
        {busy === "wa" ? "Armando la figurita…" : "Mandala por WhatsApp"}
      </button>
      <button
        type="button"
        onClick={() => share("ig")}
        disabled={busy !== null}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-surface font-extrabold active:scale-[0.98] disabled:opacity-60"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
        {busy === "ig" ? "Armando la historia…" : "Subila a tu historia de Instagram"}
      </button>
      {msg && <p className="text-center text-sm font-bold">{msg}</p>}
    </div>
  );
}

/** Revelación del lunes: se abre sola la primera vez de la semana; después, con el botón. */
export function FiguritaReveal({ d, weekKey, autoOpen, force = false }: { d: FiguritaData; weekKey: string; autoOpen: boolean; force?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!autoOpen) return;
    if (force) {
      // Viene del aviso: se abre siempre y se limpia la dirección
      setOpen(true);
      try {
        localStorage.setItem(`ringo-figurita-${weekKey}`, "1");
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        /* nada */
      }
      return;
    }
    try {
      const k = `ringo-figurita-${weekKey}`;
      if (!localStorage.getItem(k)) {
        localStorage.setItem(k, "1");
        setOpen(true);
      }
    } catch {
      /* sin almacenamiento: no se abre sola */
    }
  }, [autoOpen, weekKey, force]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-surface px-5 py-4 text-left active:scale-[0.99]"
      >
        <span>
          <span className="block font-black">🃏 Tu figurita de la semana</span>
          <span className="block text-sm text-muted">
            {LEVELS.find((l) => l.key === d.level)!.emoji} {LEVELS.find((l) => l.key === d.level)!.name} · {d.pos}ª de {d.total}
          </span>
        </span>
        <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-black text-accent-fg">Ver</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95" role="dialog" aria-modal="true" aria-label="Tu figurita">
          <div className="mx-auto flex min-h-full max-w-md flex-col items-center gap-5 px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="self-end grid size-10 place-items-center rounded-full bg-surface">
              <X className="size-5" />
            </button>
            <Confetti />
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">Ringo Club · semana del {d.week}</p>
              <h2 className="text-3xl font-black leading-tight">¡Salió tu figurita!</h2>
            </div>
            <div className="animate-in zoom-in-50 fade-in duration-700">
              <FiguritaCard d={d} />
            </div>
            <p className="text-center text-sm font-extrabold text-accent">{changeText(d.level, d.prevLevel)}</p>
            <ShareFigurita d={d} className="w-full" />
            <button type="button" onClick={() => setOpen(false)} className="h-12 w-full rounded-full bg-surface font-extrabold">
              Ver el podio
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Confetti() {
  const bits = [
    "left-[8%] top-[10%] rotate-12",
    "right-[10%] top-[14%] -rotate-45",
    "left-[4%] top-[34%] rotate-45",
    "right-[6%] top-[38%] rotate-12",
    "left-[10%] top-[66%] -rotate-12",
    "right-[8%] top-[70%] rotate-45",
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      {bits.map((b, i) => (
        <span key={i} className={cn("absolute h-2 w-3 rounded-sm bg-accent animate-in fade-in slide-in-from-top-10 duration-1000", b)} />
      ))}
    </div>
  );
}
