import assert from "node:assert/strict";
import { test } from "node:test";
import { isoDay, weekDates, weekStart } from "../src/lib/week";
import { compensateDeadline, eventPhase } from "../src/lib/events";

test("la semana arranca el lunes", () => {
  assert.equal(isoDay("2026-11-16"), 1); // lunes
  assert.equal(isoDay("2026-11-15"), 7); // domingo
  assert.equal(weekStart("2026-11-15"), "2026-11-09");
  assert.equal(weekStart("2026-11-16"), "2026-11-16");
  assert.deepEqual(weekDates("2026-11-19").slice(0, 1).concat(weekDates("2026-11-19").slice(6)), ["2026-11-16", "2026-11-22"]);
});

test("fases de un derrape el viernes 20: se compensa hasta el domingo", () => {
  const ev = { date: "2026-11-20", compensated_at: null };
  assert.equal(eventPhase(ev, "2026-11-17"), "upcoming");
  assert.equal(eventPhase(ev, "2026-11-19"), "tomorrow");
  assert.equal(eventPhase(ev, "2026-11-20"), "today");
  assert.equal(eventPhase(ev, "2026-11-21"), "compensate");
  assert.equal(eventPhase(ev, "2026-11-22"), "compensate");
  assert.equal(eventPhase(ev, "2026-11-23"), "missed"); // lunes: cerró la semana sin compensar
  assert.equal(eventPhase({ ...ev, compensated_at: "x" }, "2026-11-21"), "compensated");
});

test("plazo para compensar: el domingo de esa semana (o el lunes si fue domingo)", () => {
  assert.equal(compensateDeadline("2026-11-17"), "2026-11-22"); // martes → domingo
  assert.equal(compensateDeadline("2026-11-21"), "2026-11-22"); // sábado → domingo
  assert.equal(compensateDeadline("2026-11-22"), "2026-11-23"); // domingo → lunes
  const lunes = { date: "2026-11-16", compensated_at: null };
  assert.equal(eventPhase(lunes, "2026-11-21"), "compensate");
  assert.equal(eventPhase(lunes, "2026-11-24"), "missed");
});
