import assert from "node:assert/strict";
import { test } from "node:test";
import { fastStage } from "../src/lib/fast-stages";

const H = 3_600_000;

test("etapas según las horas de ayuno", () => {
  assert.equal(fastStage(0).current.name, "Digestión");
  assert.equal(fastStage(3.9 * H).current.name, "Digestión");
  assert.equal(fastStage(4 * H).current.name, "Azúcar estable");
  assert.equal(fastStage(13 * H).current.name, "Modo quemagrasa");
  assert.equal(fastStage(16 * H).current.name, "Cetosis");
  assert.equal(fastStage(30 * H).current.name, "Nivel monje");
});

test("cuánto falta para la próxima", () => {
  const s = fastStage(10.5 * H);
  assert.equal(s.next?.name, "Modo quemagrasa");
  assert.equal(s.msToNext, 1.5 * H);
  assert.equal(fastStage(25 * H).next, null);
});
