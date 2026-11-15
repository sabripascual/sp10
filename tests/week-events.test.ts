import assert from "node:assert/strict";
import { test } from "node:test";
import { isoDay, weekDates, weekStart } from "../src/lib/week";
import { eventPhase } from "../src/lib/events";

test("la semana arranca el lunes", () => {
  assert.equal(isoDay("2026-11-16"), 1); // lunes
  assert.equal(isoDay("2026-11-15"), 7); // domingo
  assert.equal(weekStart("2026-11-15"), "2026-11-09");
  assert.equal(weekStart("2026-11-16"), "2026-11-16");
  assert.deepEqual(weekDates("2026-11-19").slice(0, 1).concat(weekDates("2026-11-19").slice(6)), ["2026-11-16", "2026-11-22"]);
});

test("fases de un evento el 20", () => {
  const ev = { date: "2026-11-20", compensated_at: null };
  assert.equal(eventPhase(ev, "2026-11-17"), "upcoming");
  assert.equal(eventPhase(ev, "2026-11-19"), "tomorrow");
  assert.equal(eventPhase(ev, "2026-11-20"), "today");
  assert.equal(eventPhase(ev, "2026-11-21"), "compensate");
  assert.equal(eventPhase(ev, "2026-11-22"), "compensate");
  assert.equal(eventPhase(ev, "2026-11-23"), "pending");
  assert.equal(eventPhase({ ...ev, compensated_at: "x" }, "2026-11-21"), "compensated");
});
