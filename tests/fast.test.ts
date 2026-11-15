import assert from "node:assert/strict";
import { test } from "node:test";
import { fastStreak, getFastState, type FastDay } from "../src/lib/fast";

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

test("a las 14:00 está la ventana abierta y ya no se puede extender", () => {
  const s = getFastState(at("2026-11-16T14:00:00"), cfg, new Map());
  assert.equal(s.phase, "eating");
  if (s.phase === "eating") {
    assert.equal(s.next.date, "2026-11-16");
    assert.equal(s.canExtend, false);
  }
});

test("a las 11:30 se puede extender el ayuno que terminó", () => {
  const s = getFastState(at("2026-11-16T11:30:00"), cfg, new Map());
  assert.equal(s.phase, "eating");
  if (s.phase === "eating") assert.equal(s.canExtend, true);
});

test("extendido +2 h, a las 12:00 sigue ayunando", () => {
  const s = getFastState(at("2026-11-16T12:00:00"), cfg, recs({ date: "2026-11-15", status: "extended", extra_hours: 2 }));
  assert.equal(s.phase, "fasting");
});

test("roto queda en fase broken", () => {
  const s = getFastState(at("2026-11-15T23:00:00"), cfg, recs({ date: "2026-11-15", status: "broken" }));
  assert.equal(s.phase, "broken");
});

test("racha: cuenta los cumplidos y corta en el roto", () => {
  const now = at("2026-11-20T15:00:00");
  // desde el 10; el 14 se rompió → cumplidos 15, 16, 17, 18, 19 = 5
  assert.equal(fastStreak(now, cfg, recs({ date: "2026-11-14", status: "broken" }), "2026-11-10"), 5);
  // el evento no corta
  assert.equal(fastStreak(now, cfg, recs({ date: "2026-11-17", status: "event" }), "2026-11-15"), 5);
});

test("racha: el ayuno en curso no suma, pero si está roto la deja en 0", () => {
  assert.equal(fastStreak(at("2026-11-16T22:00:00"), cfg, new Map(), "2026-11-15"), 1);
  assert.equal(fastStreak(at("2026-11-16T22:00:00"), cfg, recs({ date: "2026-11-16", status: "broken" }), "2026-11-15"), 0);
});
