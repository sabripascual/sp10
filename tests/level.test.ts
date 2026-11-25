import assert from "node:assert/strict";
import { test } from "node:test";
import { firstGradedWeek, levelFor, levelHistory, scoreParts, weekScore } from "../src/lib/level";
import type { WeekSummary } from "../src/lib/progress";

const w = (x: Partial<WeekSummary>): WeekSummary => ({
  weekStart: "2026-11-16", isCurrent: false, strength: 0, strengthGoal: 3, fastOk: 7, fastDays: 7,
  compensated: 0, missed: 0, runMinutes: 0, otherWorkouts: 0, byType: {}, goals: { ayuno: 5, fuerza: 2, futbol: 1 }, ...x,
});

// Objetivo de ejemplo: 5 ayunos, 2 fierritos, 1 fútbol → 100 pts repartidos 34/33/33. Los derrapes no restan.
const t = (fuerza: number, futbol: number) => ({ fuerza, futbol });

test("semana ideal cumplida es nivel dios", () => {
  assert.equal(weekScore(w({ byType: t(2, 1) })), 100);
  assert.equal(levelFor(100).key, "dios");
});

test("solo ayuno: vagoneta; poco de todo: pajera; los derrapes sin compensar no restan", () => {
  assert.equal(weekScore(w({})), 34);
  assert.equal(levelFor(34).key, "vagoneta");
  assert.equal(levelFor(weekScore(w({ fastOk: 2 }))).key, "pajera"); // 14
  assert.equal(weekScore(w({ missed: 3 })), weekScore(w({})));
});

test("motivada y crack", () => {
  assert.equal(levelFor(weekScore(w({ byType: t(1, 1) }))).key, "crack"); // 34+17+33 = 84
  assert.equal(levelFor(weekScore(w({ fastOk: 3, byType: t(1, 1) }))).key, "motivada"); // 20+17+33 = 70
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

test("desglose de puntos con el porqué (sin derrapes)", () => {
  const x = w({ fastOk: 4, byType: t(1, 0), missed: 1 });
  assert.deepEqual(scoreParts(x).map((p) => [p.key, p.points, p.max, p.why]), [
    ["ayuno", 27, 34, "4 de 5"],
    ["fuerza", 17, 33, "1 de 2"],
    ["futbol", 0, 33, "0 de 1"],
  ]);
  assert.equal(weekScore(x), 44);
});
