import assert from "node:assert/strict";
import { test } from "node:test";
import { closeOutcome, extraHoursFor, fastStreak, getFastState, misfiledMoves, startDateFor, type FastDay } from "../src/lib/fast";

const cfg = { fast_start: "19:00:00", fast_end: "11:00:00", timezone: "America/Argentina/Tucuman" };
const at = (iso: string) => new Date(`${iso}-03:00`);
const recs = (...r: Partial<FastDay>[]) =>
  new Map(r.map((x) => [x.date!, { status: "ok", broken_at: null, extra_hours: 0, event_id: null, ...x } as FastDay]));

test("a las 22:00 está ayunando el ayuno de hoy", () => {
  const s = getFastState(at("2026-11-15T22:00:00"), cfg, new Map());
  assert.equal(s.phase, "fasting");
  if (s.phase === "fasting") {
    assert.equal(s.window.date, "2026-11-15");
    assert.equal(s.window.end.toISOString(), at("2026-11-16T11:00:00").toISOString());
  }
});

test("a las 9:00 sigue el ayuno de anoche", () => {
  const s = getFastState(at("2026-11-16T09:00:00"), cfg, new Map());
  assert.equal(s.phase, "fasting");
  if (s.phase === "fasting") assert.equal(s.window.date, "2026-11-15");
});

test("a las 17:30 (6 h después sin confirmar) se da por terminado y la ventana está abierta", () => {
  const s = getFastState(at("2026-11-16T17:30:00"), cfg, new Map());
  assert.equal(s.phase, "eating");
  if (s.phase === "eating") {
    assert.equal(s.next.date, "2026-11-16");
    assert.equal(s.canExtend, false);
  }
});

test("a las 11:30 sin confirmar: sigue (overtime) y pregunta si terminaste", () => {
  const s = getFastState(at("2026-11-16T11:30:00"), cfg, new Map());
  assert.equal(s.phase, "overtime");
  if (s.phase === "overtime") assert.equal(s.window.date, "2026-11-15");
});

test("Seguir +1 h en overtime corre el fin a 1 h desde ahora", () => {
  const now = at("2026-11-16T11:40:00");
  const s = getFastState(now, cfg, new Map());
  if (s.phase !== "overtime") throw new Error("esperaba overtime");
  const extra = extraHoursFor(s.window, now, 1, cfg); // 12:40 → 2 h extra (fin 13:00)
  assert.equal(extra, 2);
  const r = new Map([["2026-11-15", { date: "2026-11-15", status: "extended" as const, broken_at: null, extra_hours: extra, event_id: null }]]);
  assert.equal(getFastState(now, cfg, r).phase, "fasting");
});

test("terminado a mano no queda en overtime", () => {
  const r = new Map([["2026-11-15", { date: "2026-11-15", status: "ok" as const, broken_at: null, extra_hours: 0, event_id: null, ended_at: at("2026-11-16T11:05:00").toISOString() }]]);
  assert.equal(getFastState(at("2026-11-16T11:30:00"), cfg, r).phase, "eating");
});

test("extendido +2 h, a las 12:00 sigue ayunando", () => {
  const s = getFastState(at("2026-11-16T12:00:00"), cfg, recs({ date: "2026-11-15", status: "extended", extra_hours: 2 }));
  assert.equal(s.phase, "fasting");
});

test("Empezar a las 20:30 corre el fin a las 12:30", () => {
  const r = recs({ date: "2026-11-15", started_at: at("2026-11-15T20:30:00").toISOString() });
  const s = getFastState(at("2026-11-16T12:00:00"), cfg, r);
  assert.equal(s.phase, "fasting");
  if (s.phase === "fasting") assert.equal(s.window.end.toISOString(), at("2026-11-16T12:30:00").toISOString());
});

test("Terminar a las 23:00 deja la ventana abierta y se puede retomar", () => {
  const r = recs({ date: "2026-11-15", status: "broken", ended_at: at("2026-11-15T23:00:00").toISOString() });
  const s = getFastState(at("2026-11-15T23:30:00"), cfg, r);
  assert.equal(s.phase, "eating");
  if (s.phase === "eating") {
    assert.equal(s.previous.date, "2026-11-15");
    assert.equal(s.canResume, true);
    assert.equal(s.canExtend, false);
    assert.equal(s.next.date, "2026-11-16");
  }
});

test("closeOutcome: corto, justo, con changüí y extendido", () => {
  const start = at("2026-11-15T19:00:00");
  assert.equal(closeOutcome(start, at("2026-11-16T08:00:00"), cfg).status, "broken");
  assert.equal(closeOutcome(start, at("2026-11-16T10:55:00"), cfg).status, "ok");
  assert.equal(closeOutcome(start, at("2026-11-16T11:20:00"), cfg).status, "ok");
  const ext = closeOutcome(start, at("2026-11-16T13:05:00"), cfg);
  assert.deepEqual([ext.status, ext.extra_hours], ["extended", 2]);
});

test("racha: cuenta los cumplidos y corta en el roto", () => {
  const now = at("2026-11-20T15:00:00");
  assert.equal(fastStreak(now, cfg, recs({ date: "2026-11-14", status: "broken" }), "2026-11-10"), 5);
  assert.equal(fastStreak(now, cfg, recs({ date: "2026-11-17", status: "event" }), "2026-11-15"), 5);
});

test("racha: el ayuno en curso no suma; uno cortado hoy la deja en 0", () => {
  assert.equal(fastStreak(at("2026-11-16T22:00:00"), cfg, new Map(), "2026-11-15"), 1);
  const r = recs({ date: "2026-11-16", status: "broken", ended_at: at("2026-11-16T21:00:00").toISOString() });
  assert.equal(fastStreak(at("2026-11-16T22:00:00"), cfg, r, "2026-11-15"), 0);
});

test("Recién arranco a la 1 AM: el ayuno arranca ahora y el anterior queda perdido (0 h)", async () => {
  const { dayMark, fastWindow, fastDuration } = await import("../src/lib/fast");
  const now = at("2026-11-21T01:00:00");
  const prevStart = at("2026-11-19T19:00:00").toISOString();
  const r = new Map([
    ["2026-11-19", { date: "2026-11-19", status: "broken" as const, broken_at: prevStart, extra_hours: 2, event_id: "e", ended_at: null }],
    ["2026-11-20", { date: "2026-11-20", status: "ok" as const, broken_at: null, extra_hours: 0, event_id: null, started_at: now.toISOString() }],
  ]);
  const s = getFastState(at("2026-11-21T01:05:00"), cfg, r);
  assert.equal(s.phase, "fasting");
  if (s.phase === "fasting") assert.equal(s.window.end.toISOString(), at("2026-11-21T17:00:00").toISOString());
  assert.equal(dayMark("2026-11-19", now, cfg, r, "2026-11-15"), "broken");
  assert.equal(fastDuration(fastWindow("2026-11-19", cfg, r.get("2026-11-19")!)), 0);
});

test("horas reales: 20:30 → 12:15 del día siguiente; inicio de madrugada", async () => {
  const { resolveFastTimes } = await import("../src/lib/fast");
  const a = resolveFastTimes("2026-11-22", "20:30", "12:15", cfg.timezone);
  assert.equal(a.start.toISOString(), at("2026-11-22T20:30:00").toISOString());
  assert.equal(a.end.toISOString(), at("2026-11-23T12:15:00").toISOString());
  const b = resolveFastTimes("2026-11-22", "01:00", "17:00", cfg.timezone);
  assert.equal(b.start.toISOString(), at("2026-11-23T01:00:00").toISOString());
  assert.equal(b.end.toISOString(), at("2026-11-23T17:00:00").toISOString());
});

// Bug: cortar el ayuno de esta noche y volver a "Empezar" lo guardaba como el de mañana
// (después de terminarlo, la ventana abierta mostraba ~32 h hasta el próximo).
const day = (date: string, extra: Partial<FastDay> = {}): FastDay => ({ date, status: "ok", broken_at: null, extra_hours: 0, event_id: null, ...extra });

test("Empezar después de cortar el de esta noche: sigue siendo el de esta noche", () => {
  const cut = day("2026-11-24", { status: "broken", broken_at: "2026-11-24T22:30:00Z", ended_at: "2026-11-24T22:30:00Z" });
  const records = new Map([["2026-11-24", cut]]);
  const now = new Date("2026-11-24T23:00:00Z"); // 20:00 en Argentina
  assert.equal(startDateFor(now, cfg, records, "2026-11-25"), "2026-11-24");
});

test("Empezar antes de la hora: es el de esta noche; a la mañana después de cumplir, el de la noche", () => {
  assert.equal(startDateFor(new Date("2026-11-24T21:00:00Z"), cfg, new Map(), "x"), "2026-11-24"); // 18:00
  const done = day("2026-11-24", { started_at: "2026-11-24T22:00:00Z", ended_at: "2026-11-25T14:00:00Z" });
  // 12:30 del 25, el del 24 cumplido: el próximo es el del 25
  assert.equal(startDateFor(new Date("2026-11-25T15:30:00Z"), cfg, new Map([["2026-11-24", done]]), "x"), "2026-11-25");
});

test("Un cumplido nunca se pisa", () => {
  const done = day("2026-11-24", { started_at: "2026-11-24T22:00:00Z", ended_at: "2026-11-25T14:00:00Z" });
  // 11:30 del 25: el más cercano por horario sería el del 25 (19:00), que todavía no arrancó
  assert.equal(startDateFor(new Date("2026-11-25T14:30:00Z"), cfg, new Map([["2026-11-24", done]]), "x"), "2026-11-25");
});

test("Arreglo: el ayuno guardado con la fecha de la noche siguiente se pasa a su noche", () => {
  const records = new Map([
    ["2026-11-24", day("2026-11-24", { status: "broken", broken_at: "2026-11-24T22:30:00Z" })],
    ["2026-11-25", day("2026-11-25", { started_at: "2026-11-24T23:00:00Z", ended_at: "2026-11-25T13:00:00Z" })],
  ]);
  assert.deepEqual(misfiledMoves(records, cfg.timezone, "2026-11-01"), [["2026-11-25", "2026-11-24"]]);
  // empezado temprano (antes del horario) el mismo día: está bien
  const ok = new Map([["2026-11-25", day("2026-11-25", { started_at: "2026-11-25T20:00:00Z" })]]);
  assert.deepEqual(misfiledMoves(ok, cfg.timezone, "2026-11-01"), []);
  // la noche anterior tiene un ayuno cumplido: no se toca
  const busy = new Map([
    ["2026-11-24", day("2026-11-24", { started_at: "2026-11-24T22:00:00Z", ended_at: "2026-11-25T14:00:00Z" })],
    ["2026-11-25", day("2026-11-25", { started_at: "2026-11-24T23:00:00Z" })],
  ]);
  assert.deepEqual(misfiledMoves(busy, cfg.timezone, "2026-11-01"), []);
});

test("Después de arreglarlo, la ventana abierta cierra esta noche (no en 32 h)", () => {
  const records = new Map([["2026-11-24", day("2026-11-24", { started_at: "2026-11-24T23:00:00Z", ended_at: "2026-11-25T13:00:00Z" })]]);
  const s = getFastState(new Date("2026-11-25T13:30:00Z"), cfg, records);
  assert.equal(s.phase, "eating");
  if (s.phase === "eating") assert.equal(s.next.start.toISOString(), "2026-11-25T22:00:00.000Z");
});
