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
    goals: { ayuno: 5, fuerza: 3, futbol: 1 },
    weeks: 1,
  });
  // lun 16 a sáb 21 terminaron (6), el del dom 22 está en curso; el 18 cortado → 5/6
  // ayunos 5/5 y fierritos 3/3 completos, fútbol 0/1 (el del lunes fue "no fui") → 67%
  // los minutos de carrera no salen: correr no es parte de esta rutina
  assert.equal(summaryText(s[0]), "67% de tu semana, 5/5 ayunos, 3/3 fierritos, 0/1 fútbol, 1 derrape compensado");
});

test("semanas con fuerza cumplida", () => {
  const w = (strength: number, isCurrent = false): WeekSummary => ({
    weekStart: "", isCurrent, strength, strengthGoal: 3, fastOk: 0, fastDays: 0, compensated: 0, missed: 0, runMinutes: 0, otherWorkouts: 0, byType: {}, sessionsByType: {}, minutesByType: {}, runKcal: 0, goals: { fuerza: 3 },
  });
  assert.deepEqual(strengthWeekStreaks([w(3), w(3), w(1), w(3), w(3), w(1, true)]), { current: 2, max: 2 });
  assert.deepEqual(strengthWeekStreaks([w(3), w(3), w(3, true)]), { current: 3, max: 3 });
});

test("compensados seguidos: lo no compensado corta, lo que todavía se puede compensar no", () => {
  const today = "2026-11-30";
  const evs = [
    { date: "2026-11-01", compensated_at: "x" },
    { date: "2026-11-08", compensated_at: null }, // no compensado
    { date: "2026-11-15", compensated_at: "x" },
    { date: "2026-11-22", compensated_at: "x" },
    { date: "2026-11-29", compensated_at: null }, // domingo: se puede compensar hasta el lunes 30
  ];
  assert.deepEqual(compensatedStreak(evs, today), { current: 2, total: 3 });
});

import { measureChange, zoneStats } from "../src/lib/progress";

test("fierritos por zona y lo que más entrenás", () => {
  const z = (exercises: number, reps: number, rounds: number) => ({ exercises, reps, rounds });
  const ws = [
    { type: "fuerza", status: "done", details: { zones: { piernas: z(3, 12, 3), core: z(2, 15, 3) } } },
    { type: "fuerza", status: "done", details: { zones: { piernas: z(4, 10, 3) } } },
    { type: "correr", status: "done", details: {} },
  ];
  const { stats, top } = zoneStats(ws);
  assert.equal(top, "piernas");
  assert.deepEqual(stats.find((s) => s.zone === "piernas"), { zone: "piernas", sessions: 2, rounds: 6, reps: 228 });
  assert.equal(zoneStats([]).top, null);
});

test("cambio de medida entre el primer y el último control", () => {
  const cs = [
    { date: "2026-11-16", thigh_cm: 56 },
    { date: "2026-11-30", thigh_cm: null },
    { date: "2026-12-14", thigh_cm: 54.5 },
  ];
  assert.equal(measureChange(cs, "thigh_cm"), -1.5);
  assert.equal(measureChange(cs.slice(0, 1), "thigh_cm"), null);
});

test("el entreno que compensó un derrape cuenta la mitad para la semana ideal", () => {
  const s = weekSummaries({
    now: at("2026-11-22T21:00:00"),
    cfg,
    since: "2026-11-15",
    records: new Map(),
    workouts: [
      { id: "w1", date: "2026-11-17", type: "fuerza", minutes: 60, status: "done" },
      { id: "w2", date: "2026-11-19", type: "fuerza", minutes: 60, status: "done" },
    ],
    events: [{ date: "2026-11-18", compensated_at: "x", compensated_by: "w2" }],
    goals: { fuerza: 2 },
    weeks: 1,
  });
  assert.equal(s[0].byType.fuerza, 1.5);
  assert.equal(s[0].strength, 2); // las sesiones se cuentan igual
});

import { pendingGoals, profileGoals } from "../src/lib/goals";

test("semana ideal con historial: cada semana con sus objetivos; los cambios desde el lunes siguiente", () => {
  const p = {
    strength_goal: 3,
    weekly_goals: { ayuno: 5, fuerza: 1 },
    goals_history: [
      { from: "2000-01-01", goals: { ayuno: 5, fuerza: 3 } },
      { from: "2026-11-30", goals: { ayuno: 5, fuerza: 1 } },
    ],
  };
  assert.deepEqual(profileGoals(p, "2026-11-23"), { ayuno: 5, fuerza: 3 }); // esta semana: los de antes
  assert.deepEqual(profileGoals(p, "2026-11-30"), { ayuno: 5, fuerza: 1 }); // desde el lunes
  assert.equal(pendingGoals(p, "2026-11-23")?.from, "2026-11-30");
  assert.equal(pendingGoals(p, "2026-11-30"), null);
  // sin historial: como antes
  assert.deepEqual(profileGoals({ strength_goal: 2, weekly_goals: { futbol: 1 } }), { futbol: 1 });
  // sin ayuno, el ayuno no cuenta aunque esté en el historial
  assert.deepEqual(profileGoals({ ...p, fasting_enabled: false }, "2026-11-23"), { fuerza: 3 });
});

import { goalSeries, idealStats, otherWorkouts } from "../src/lib/progress";

test("progreso según la semana ideal: racha al 100 %, por objetivo y otros entrenos", () => {
  const wk = (ws: string, fuerza: number, extra: Record<string, number> = {}, isCurrent = false, goals: Record<string, number> = { fuerza: 2 }) => ({
    weekStart: ws, isCurrent, strength: fuerza, strengthGoal: goals.fuerza ?? 0, fastOk: 0, fastDays: 7, compensated: 0, missed: 0, runMinutes: 0, otherWorkouts: 0,
    byType: { fuerza, ...extra }, sessionsByType: { fuerza, ...extra }, minutesByType: { fuerza: fuerza * 60 }, runKcal: 0, goals,
  });
  const weeks = [wk("2026-10-26", 1), wk("2026-11-02", 2), wk("2026-11-09", 3, { tenis: 1 }), wk("2026-11-16", 2, { trekking: 1 }), wk("2026-11-23", 0, {}, true)];
  const ideal = idealStats(weeks);
  assert.deepEqual(ideal.streak, { current: 3, max: 3 }); // la semana en curso todavía no corta
  assert.equal(ideal.avg4, 88); // 50, 100, 100, 100
  assert.equal(ideal.best, 100);
  const f = goalSeries(weeks, "fuerza");
  assert.deepEqual(f.series.map((s) => [s.done, s.target]), [[1, 2], [2, 2], [3, 2], [2, 2], [0, 2]]);
  assert.deepEqual(f.streak, { current: 3, max: 3 });
  assert.deepEqual(otherWorkouts(weeks, ["fuerza"]), [["tenis", 1], ["trekking", 1]]);
  // una semana sin ese objetivo no suma ni corta
  const g = goalSeries([wk("2026-11-02", 2), wk("2026-11-09", 0, {}, false, {}), wk("2026-11-16", 2)], "fuerza");
  assert.equal(g.streak.max, 2);
});
