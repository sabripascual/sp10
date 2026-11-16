import assert from "node:assert/strict";
import { test } from "node:test";
import { firstGradedWeek, levelFor, levelHistory, scoreParts, weekScore } from "../src/lib/level";
import type { WeekSummary } from "../src/lib/progress";

const w = (x: Partial<WeekSummary>): WeekSummary => ({
  weekStart: "2026-11-16", isCurrent: false, strength: 0, strengthGoal: 3, fastOk: 7, fastDays: 7,
  compensated: 0, pending: 0, runMinutes: 0, otherWorkouts: 0, ...x,
});

test("semana perfecta es nivel dios", () => {
  assert.equal(weekScore(w({ strength: 3, otherWorkouts: 3 })), 100);
  assert.equal(levelFor(100).key, "dios");
});

test("buen ayuno y nada de entreno: promedio; con un derrape pendiente: vagoneta", () => {
  assert.equal(levelFor(weekScore(w({}))).key, "promedio"); // 35 + 15 = 50
  assert.equal(levelFor(weekScore(w({ pending: 1 }))).key, "vagoneta"); // 42,5 → 43
});

test("poco ayuno, poco entreno y derrapes: pajera", () => {
  assert.equal(levelFor(weekScore(w({ fastOk: 2, pending: 2 }))).key, "pajera");
});

test("motivada y crack", () => {
  assert.equal(levelFor(weekScore(w({ strength: 2, otherWorkouts: 1 }))).key, "crack"); // 35+23+5+15=78
  assert.equal(levelFor(weekScore(w({ fastOk: 5, strength: 2 }))).key, "motivada"); // 25+23+0+15=63
});

test("historial: solo semanas cerradas desde el inicio", () => {
  const h = levelHistory(
    [w({ weekStart: "2026-11-09" }), w({ weekStart: "2026-11-16", strength: 3, otherWorkouts: 3 }), w({ weekStart: "2026-11-23", isCurrent: true })],
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
  const parts = scoreParts(w({ fastOk: 6, strength: 2, otherWorkouts: 1, pending: 1 }));
  assert.deepEqual(parts.map((p) => [p.key, p.points, p.why]), [
    ["ayuno", 30, "6/7 ayunos"],
    ["fierritos", 23, "2/3 fierritos"],
    ["movimiento", 5, "1/3 extra"],
    ["derrapes", 8, "1 sin compensar"],
  ]);
  assert.equal(weekScore(w({ fastOk: 6, strength: 2, otherWorkouts: 1, pending: 1 })), 66);
});
