import assert from "node:assert/strict";
import { test } from "node:test";
import { measureDeltas, nextCheckDate, weightTrend, type BodyCheck } from "../src/lib/body";

const check = (date: string, x: Partial<BodyCheck> = {}): BodyCheck => ({
  id: date, date, weight_kg: null, note: null, waist_cm: null, hip_cm: null, chest_cm: null, arm_cm: null, thigh_cm: null, ...x,
});

test("próximo control: el primero en la fecha elegida, después cada 14 días", () => {
  assert.equal(nextCheckDate([], "2026-11-16", "2026-11-15"), "2026-11-16");
  assert.equal(nextCheckDate([check("2026-11-16"), check("2026-11-30")], "2026-11-16", "2026-12-01"), "2026-12-14");
});

test("tendencia del peso con margen", () => {
  assert.equal(weightTrend([check("2026-11-16", { weight_kg: 70 })]), null);
  assert.equal(weightTrend([check("2026-11-16", { weight_kg: 70 }), check("2026-11-30", { weight_kg: 69.2 })]), "bajando");
  assert.equal(weightTrend([check("2026-11-16", { weight_kg: 70 }), check("2026-11-30", { weight_kg: 70.2 })]), "estable");
  assert.equal(weightTrend([check("2026-11-16", { weight_kg: 70 }), check("2026-11-30", { weight_kg: 71 })]), "subiendo");
});

test("diferencias contra el control anterior que tenga la medida", () => {
  const a = check("2026-11-16", { waist_cm: 80, arm_cm: 30 });
  const b = check("2026-11-30", { arm_cm: 29.5 });
  const c = check("2026-12-14", { waist_cm: 78.5, arm_cm: 29.5 });
  const d = measureDeltas([a, b, c], c);
  assert.equal(d.find((x) => x.key === "waist_cm")!.delta, -1.5);
  assert.equal(d.find((x) => x.key === "arm_cm")!.delta, 0);
  assert.equal(d.find((x) => x.key === "hip_cm")!.delta, null);
});
