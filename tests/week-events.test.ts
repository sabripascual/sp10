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

import { compensationCheck, compFastDone, compPrefsOf, workoutCompensates } from "../src/lib/events";

test("compensación automática: deporte y minutos dentro del plazo", () => {
  const ev = { date: "2026-11-18", compensation: "workout" as const, compensated_at: null, comp_detail: { sport: "correr", minutes: 45, fastHours: 2 } };
  const w = (id: string, date: string, type: string, minutes: number | null) => ({ id, date, type, minutes, status: "done" });
  assert.equal(workoutCompensates(ev, w("a", "2026-11-19", "correr", 50)), true);
  assert.equal(workoutCompensates(ev, w("b", "2026-11-19", "correr", 30)), false); // pocos minutos
  assert.equal(workoutCompensates(ev, w("c", "2026-11-19", "fuerza", 60)), false); // otro deporte
  assert.equal(workoutCompensates(ev, w("d", "2026-11-18", "correr", 60)), false); // el mismo día del derrape
  assert.equal(workoutCompensates(ev, w("e", "2026-11-23", "correr", 60)), false); // pasado el domingo
  // ya usado para otro derrape
  assert.equal(compensationCheck(ev, [w("a", "2026-11-19", "correr", 50)], false, new Set(["a"])).complete, false);
  // derrapes viejos sin detalle: fierritos o 30 min de carrera
  const legacy = { date: "2026-11-18", compensation: "workout" as const, compensated_at: null };
  assert.equal(workoutCompensates(legacy, w("f", "2026-11-19", "fuerza", null)), true);
});

test("compensación con las dos: hace falta el entreno y el ayuno extra", () => {
  const ev = { date: "2026-11-18", compensation: "both" as const, compensated_at: null, comp_detail: { sport: "any", minutes: 0, fastHours: 2 } };
  const ws = [{ id: "a", date: "2026-11-20", type: "padel", minutes: null, status: "done" }];
  assert.equal(compensationCheck(ev, ws, false).complete, false);
  assert.equal(compensationCheck(ev, ws, true).complete, true);
});

test("ayuno extra cumplido: 16 + 2 h (terminado a mano o por tiempo)", () => {
  const cfg = { fast_start: "19:00:00", fast_end: "11:00:00", timezone: "America/Argentina/Tucuman" };
  const at = (iso: string) => new Date(`${iso}-03:00`);
  const rec = (x: object) => ({ date: "2026-11-18", status: "event" as const, broken_at: null, extra_hours: 2, event_id: "e", ...x });
  assert.equal(compFastDone("2026-11-18", cfg, rec({ ended_at: at("2026-11-19T13:05:00").toISOString() }), 2, at("2026-11-19T14:00:00")), true);
  assert.equal(compFastDone("2026-11-18", cfg, rec({ ended_at: at("2026-11-19T11:30:00").toISOString() }), 2, at("2026-11-19T14:00:00")), false);
  assert.equal(compFastDone("2026-11-18", cfg, rec({}), 2, at("2026-11-19T14:00:00")), false); // todavía puede confirmar
  assert.equal(compFastDone("2026-11-18", cfg, rec({}), 2, at("2026-11-19T20:00:00")), true); // se dio por hecho
  assert.equal(compFastDone("2026-11-18", cfg, rec({ status: "broken" }), 2, at("2026-11-19T20:00:00")), false);
});

test("preferencias de compensación: sin ayuno, solo entreno", () => {
  assert.equal(compPrefsOf({ mode: "both", sport: "bici", minutes: 60, fastHours: 3 }).mode, "both");
  assert.equal(compPrefsOf({ mode: "both" }, false).mode, "workout");
  assert.deepEqual(compPrefsOf(null), { mode: "workout", sport: "fuerza", minutes: 30, fastHours: 2 });
});
