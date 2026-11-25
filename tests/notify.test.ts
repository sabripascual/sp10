import assert from "node:assert/strict";
import { test } from "node:test";
import { dueNotifications, isQuiet, type NotifyContext } from "../src/lib/notify-rules";
import { buildMessage } from "../src/lib/phrases";
import { goalProgress } from "../src/lib/goals";

const at = (iso: string) => new Date(`${iso}-03:00`);
const base = (now: Date, x: Partial<NotifyContext> = {}): NotifyContext => ({
  now,
  cfg: { fast_start: "19:00:00", fast_end: "11:00:00", timezone: "America/Argentina/Tucuman" },
  prefs: {},
  fastRecords: new Map(),
  goals: { pct: 100, items: [] },
  events: [],
  bodyNextDate: "2026-12-31",
  bodyDoneToday: false,
  weekSummary: "",
  sent: new Set(),
  ...x,
});
const kinds = (ctx: NotifyContext) => dueNotifications(ctx).map((n) => n.kind).sort();

test("18:30 cierre de ventana, 19:00 empezá el ayuno, 20:00 ¿ya empezaste?", () => {
  assert.deepEqual(kinds(base(at("2026-11-16T18:30:00"))), ["window_closing"]);
  assert.deepEqual(kinds(base(at("2026-11-16T19:05:00"))), ["fast_started"]);
  assert.deepEqual(kinds(base(at("2026-11-16T20:05:00"))), ["fast_confirm"]);
  // si ya tocó Empezar, no molesta
  const r = new Map([["2026-11-16", { date: "2026-11-16", status: "ok" as const, broken_at: null, extra_hours: 0, event_id: null, started_at: "2026-11-16T22:10:00Z" }]]);
  assert.deepEqual(kinds(base(at("2026-11-16T19:05:00"), { fastRecords: r })), []);
  assert.deepEqual(kinds(base(at("2026-11-16T20:05:00"), { fastRecords: r })), []);
});

test("13:00 sin confirmar: recordatorio; si ya terminó, nada", () => {
  assert.deepEqual(kinds(base(at("2026-11-17T13:05:00"))), ["fast_unconfirmed"]);
  const r = new Map([["2026-11-16", { date: "2026-11-16", status: "ok" as const, broken_at: null, extra_hours: 0, event_id: null, ended_at: at("2026-11-17T11:02:00").toISOString() }]]);
  assert.deepEqual(kinds(base(at("2026-11-17T11:10:00"), { fastRecords: r })), []);
  assert.deepEqual(kinds(base(at("2026-11-17T13:05:00"), { fastRecords: r })), []);
});

test("11:00 ¿terminaste?; con +2 h a las 13:00", () => {
  assert.deepEqual(kinds(base(at("2026-11-17T11:10:00"))), ["fast_done"]);
  const r = new Map([["2026-11-16", { date: "2026-11-16", status: "event" as const, broken_at: null, extra_hours: 2, event_id: "e" }]]);
  assert.deepEqual(kinds(base(at("2026-11-17T11:10:00"), { fastRecords: r })), []);
  assert.deepEqual(kinds(base(at("2026-11-17T13:00:00"), { fastRecords: r })), ["fast_done"]);
});

test("no repite lo ya enviado y respeta lo desactivado", () => {
  const now = at("2026-11-16T18:30:00");
  assert.deepEqual(kinds(base(now, { sent: new Set(["window_closing|2026-11-16"]) })), []);
  assert.deepEqual(kinds(base(now, { prefs: { window_closing: false } })), []);
});

test("silencio nocturno 23:00 a 8:30", () => {
  assert.equal(isQuiet(at("2026-11-16T23:10:00"), "America/Argentina/Tucuman"), true);
  assert.equal(isQuiet(at("2026-11-16T08:29:00"), "America/Argentina/Tucuman"), true);
  assert.equal(isQuiet(at("2026-11-16T08:30:00"), "America/Argentina/Tucuman"), false);
});

test("jueves 10:00 cómo va tu semana si falta algo, eventos y compensación", () => {
  const thu = at("2026-11-19T10:00:00");
  const items = goalProgress({ ayuno: 5, fuerza: 2 }, { fastOk: 3, byType: { fuerza: 1 } }).items;
  const due = dueNotifications(base(thu, { goals: { pct: 55, items } }));
  assert.deepEqual(due.map((n) => [n.kind, n.vars.falta]), [["week_goals", "2 ayunos y 1 fierrito"]]);
  assert.deepEqual(kinds(base(thu)), []); // semana completa: no molesta
  const events = [
    { id: "a", name: "cumple", date: "2026-11-20", compensated_at: null },
    { id: "b", name: "asado", date: "2026-11-18", compensated_at: null },
  ];
  assert.deepEqual(kinds(base(thu, { events })), ["compensation_today", "event_tomorrow"]);
});

test("control 9:30 y resumen del domingo 20:00", () => {
  assert.deepEqual(kinds(base(at("2026-11-16T09:30:00"), { bodyNextDate: "2026-11-16" })), ["body_check"]);
  assert.deepEqual(kinds(base(at("2026-11-22T20:00:00"), {})), ["fast_confirm", "weekly_summary"]);
});

test("frase con apodo, sin repetir la última", () => {
  const m = buildMessage("window_closing", {}, ["reina"], 0, () => 0);
  assert.equal(m.phraseId, 1);
  assert.equal(m.body, "Reina, metéle a la última comida que se te acaba la ventana");
});

test("domingo 10:00: último día para compensar un derrape de la semana", () => {
  const sun = at("2026-11-22T10:00:00");
  const events = [
    { id: "a", name: "cumple", date: "2026-11-18", compensated_at: null },
    { id: "b", name: "asado", date: "2026-11-19", compensated_at: "x" },
  ];
  assert.deepEqual(kinds(base(sun, { events })), ["compensation_last"]);
});
