import assert from "node:assert/strict";
import { test } from "node:test";
import { firstGradedWeek, levelFor, levelHistory, scoreParts, weekScore } from "../src/lib/level";
import type { WeekSummary } from "../src/lib/progress";

const w = (x: Partial<WeekSummary>): WeekSummary => ({
  weekStart: "2026-11-16", isCurrent: false, strength: 0, strengthGoal: 3, fastOk: 7, fastDays: 7,
  compensated: 0, missed: 0, runMinutes: 0, otherWorkouts: 0, byType: {}, goals: { ayuno: 5, fuerza: 2, futbol: 1 }, ...x,
});

// Objetivo de ejemplo: 5 ayunos, 2 fierritos, 1 fútbol → 85 pts repartidos 29/28/28 + derrapes 15
const t = (fuerza: number, futbol: number) => ({ fuerza, futbol });

test("semana ideal cumplida es nivel dios", () => {
  assert.equal(weekScore(w({ byType: t(2, 1) })), 100);
  assert.equal(levelFor(100).key, "dios");
});

test("solo ayuno: vagoneta; poco de todo y derrapes: pajera", () => {
  assert.equal(weekScore(w({})), 44); // 29 + 15
  assert.equal(levelFor(44).key, "vagoneta");
  assert.equal(levelFor(weekScore(w({ fastOk: 2, missed: 2 }))).key, "pajera"); // 12 + 0
});

test("motivada y crack", () => {
  assert.equal(levelFor(weekScore(w({ byType: t(1, 1) }))).key, "crack"); // 29+14+28+15 = 86
  assert.equal(levelFor(weekScore(w({ fastOk: 3, byType: t(1, 1) }))).key, "motivada"); // 17+14+28+15 = 74
});

test("historial: solo semanas cerradas desde el inicio", () => {
  const h = levelHistory(
    [w({ weekStart: "2026-11-09" }), w({ weekStart: "2026-11-16", byType: t(2, 1) }), w({ weekStart: "2026-11-23", isCurrent: true })],
    "2026-11-16",
  );
  assert.equal(h.graded.length, 1);
  assert.equal(h.last?.level, "dios");
  assert.equal(h.counts.dios, 1);
});

test("se califica desde la primera semana completa", () => {
  assert.equal(firstGradedWeek("2026-11-15"), "2026-11-16"); // empezó un domingo → arranca el lunes siguiente
  assert.equal(firstGradedWeek("2026-11-16"), "2026-11-16"); // empezó un lunes → esa misma semana
  assert.equal(firstGradedWeek("2026-11-18"), "2026-11-23"); // miércoles → el lunes siguiente
});

test("desglose de puntos con el porqué", () => {
  const x = w({ fastOk: 4, byType: t(1, 0), missed: 1 });
  assert.deepEqual(scoreParts(x).map((p) => [p.key, p.points, p.max, p.why]), [
    ["ayuno", 23, 29, "4 de 5"],
    ["fuerza", 14, 28, "1 de 2"],
    ["futbol", 0, 28, "0 de 1"],
    ["derrapes", 8, 15, "1 sin compensar"],
  ]);
  assert.equal(weekScore(x), 45);
});
