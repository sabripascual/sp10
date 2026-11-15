import assert from "node:assert/strict";
import { test } from "node:test";
import { compensatedStreak, fastStreaks, strengthWeekStreaks, summaryText, weekSummaries, type WeekSummary } from "../src/lib/progress";
import type { FastDay } from "../src/lib/fast";

const cfg = { fast_start: "19:00:00", fast_end: "11:00:00", timezone: "America/Argentina/Tucuman" };
const at = (iso: string) => new Date(`${iso}-03:00`);
const broken = (date: string): [string, FastDay] => [date, { date, status: "broken", broken_at: null, extra_hours: 0, event_id: null }];

test("rachas de ayuno: actual y máxima", () => {
  const recs = new Map([broken("2026-11-05")]);
  // desde el 1/11: cumplidos 1-4 (4), cortado el 5, cumplidos 6..19 (14). El 20 está en curso.
  const r = fastStreaks(at("2026-11-20T22:00:00"), cfg, recs, "2026-11-01");
  assert.deepEqual(r, { current: 14, max: 14 });
});

test("resumen de la semana", () => {
  const s = weekSummaries({
    now: at("2026-11-22T21:00:00"), // domingo
    cfg,
    since: "2026-11-15",
    records: new Map([broken("2026-11-18")]),
    workouts: [
      { date: "2026-11-17", type: "fuerza", minutes: 60, status: "done" },
      { date: "2026-11-19", type: "fuerza", minutes: 60, status: "done" },
      { date: "2026-11-21", type: "fuerza", minutes: 60, status: "done" },
      { date: "2026-11-20", type: "correr", minutes: 30, status: "done" },
      { date: "2026-11-16", type: "futbol", minutes: null, status: "skipped" },
    ],
    events: [{ date: "2026-11-20", compensated_at: "x" }],
    strengthGoal: 3,
    weeks: 1,
  });
  // lun 16 a sáb 21 terminaron (6), el del dom 22 está en curso; el 18 cortado → 5/6
  assert.equal(summaryText(s[0]), "3/3 fuerza, 5/6 ayuno, 1 evento compensado, 30 min corridos");
});

test("semanas con fuerza cumplida", () => {
  const w = (strength: number, isCurrent = false): WeekSummary => ({
    weekStart: "", isCurrent, strength, strengthGoal: 3, fastOk: 0, fastDays: 0, compensated: 0, pending: 0, runMinutes: 0,
  });
  assert.deepEqual(strengthWeekStreaks([w(3), w(3), w(1), w(3), w(3), w(1, true)]), { current: 2, max: 2 });
  assert.deepEqual(strengthWeekStreaks([w(3), w(3), w(3, true)]), { current: 3, max: 3 });
});

test("compensados seguidos: lo pendiente corta, lo que está en 48 h no", () => {
  const today = "2026-11-30";
  const evs = [
    { date: "2026-11-01", compensated_at: "x" },
    { date: "2026-11-08", compensated_at: null }, // pendiente
    { date: "2026-11-15", compensated_at: "x" },
    { date: "2026-11-22", compensated_at: "x" },
    { date: "2026-11-29", compensated_at: null }, // todavía en 48 h
  ];
  assert.deepEqual(compensatedStreak(evs, today), { current: 2, total: 3 });
});
