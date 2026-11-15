import assert from "node:assert/strict";
import { test } from "node:test";
import { dueNotifications, isQuiet, type NotifyContext } from "../src/lib/notify-rules";
import { buildMessage } from "../src/lib/phrases";

const at = (iso: string) => new Date(`${iso}-03:00`);
const base = (now: Date, x: Partial<NotifyContext> = {}): NotifyContext => ({
  now,
  cfg: { fast_start: "19:00:00", fast_end: "11:00:00", timezone: "America/Argentina/Tucuman" },
  prefs: {},
  fastRecords: new Map(),
  strengthDone: 0,
  strengthGoal: 3,
  plannedToday: null,
  plannedConfirmed: false,
  events: [],
  bodyNextDate: "2026-12-31",
  bodyDoneToday: false,
  weekSummary: "",
  sent: new Set(),
  ...x,
});
const kinds = (ctx: NotifyContext) => dueNotifications(ctx).map((n) => n.kind).sort();

test("18:30 cierre de ventana, 19:00 ayuno iniciado", () => {
  assert.deepEqual(kinds(base(at("2026-11-16T18:30:00"))), ["window_closing"]);
  assert.deepEqual(kinds(base(at("2026-11-16T19:05:00"))), ["fast_started"]);
});

test("11:00 ayuno cumplido; con +2 h a las 13:00", () => {
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

test("jueves 10:00 fuerza pendiente si va menos de 2/3, eventos y compensación", () => {
  const thu = at("2026-11-19T10:00:00");
  assert.deepEqual(kinds(base(thu, { strengthDone: 1 })), ["strength_pending"]);
  assert.deepEqual(kinds(base(thu, { strengthDone: 2 })), []);
  const events = [
    { id: "a", name: "cumple", date: "2026-11-20", compensated_at: null },
    { id: "b", name: "asado", date: "2026-11-18", compensated_at: null },
  ];
  assert.deepEqual(kinds(base(thu, { strengthDone: 2, events })), ["compensation_today", "event_tomorrow"]);
});

test("fútbol 22:00, control 9:30 y resumen del domingo 20:00", () => {
  assert.deepEqual(kinds(base(at("2026-11-16T22:00:00"), { plannedToday: "futbol" })), ["confirm_futbol"]);
  assert.deepEqual(kinds(base(at("2026-11-16T22:00:00"), { plannedToday: "futbol", plannedConfirmed: true })), []);
  assert.deepEqual(kinds(base(at("2026-11-16T09:30:00"), { bodyNextDate: "2026-11-16" })), ["body_check"]);
  assert.deepEqual(kinds(base(at("2026-11-22T20:00:00"), { strengthDone: 3 })), ["weekly_summary"]);
});

test("frase con apodo, sin repetir la última", () => {
  const m = buildMessage("window_closing", {}, ["reina"], 0, () => 0);
  assert.equal(m.phraseId, 1);
  assert.equal(m.body, "Reina, metéle a la última comida que se te acaba la ventana");
});
