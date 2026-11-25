import assert from "node:assert/strict";
import { test } from "node:test";
import { coachNotifications, forecastLevel, type CoachContext } from "../src/lib/coach-notify";
import { buildMessage } from "../src/lib/phrases";
import { goalProgress } from "../src/lib/goals";

const at = (iso: string) => new Date(`${iso}-03:00`);
const base = (now: Date, x: Partial<CoachContext> = {}): CoachContext => ({
  now,
  tz: "America/Argentina/Tucuman",
  enabled: {},
  sent: new Set(),
  fasting: true,
  last: null,
  prev: null,
  club: null,
  clubLive: null,
  current: { pct: 0, items: [] },
  fastStreak: 3,
  strengthRun: 0,
  lastActivity: at("2026-11-23T10:00:00").toISOString(),
  createdDate: "2026-11-01",
  ...x,
});
const r0 = () => 0;

test("lunes 9:30: salió tu figurita, con puesto en el Club", () => {
  const club = { pos: 2, total: 5, winner: "Juli" };
  const due = coachNotifications(
    base(at("2026-11-23T09:35:00"), { last: { weekStart: "2026-11-16", score: 78, level: "crack" }, prev: { level: "motivada" }, club }),
    r0,
  );
  assert.equal(due.length, 1);
  const msg = buildMessage(due[0].kind, due[0].vars, ["reina"], null, r0);
  assert.equal(msg.body, "🃏 ¡Salió tu figurita, reina! Sos perrita crack ⚡ y quedaste 2ª de 5 en el Club. Entrá a verla y mandala al grupo 📲");
  // otro día u otra hora: nada; apagado por el admin: nada
  assert.equal(coachNotifications(base(at("2026-11-24T09:35:00"), { last: { weekStart: "2026-11-16", score: 78, level: "crack" } })).length, 0);
  assert.equal(coachNotifications(base(at("2026-11-23T09:35:00"), { last: { weekStart: "2026-11-16", score: 78, level: "crack" }, enabled: { level_result: false } })).length, 0);
});

test("miércoles 13:00: pronóstico según cómo vas", () => {
  const goals = { ayuno: 5, fuerza: 2 };
  const slow = goalProgress(goals, { fastOk: 1, byType: {} });
  const due = coachNotifications(base(at("2026-11-25T13:10:00"), { current: slow }), r0);
  assert.equal(due[0].kind, "forecast");
  assert.match(String(due[0].vars.linea), /pronóstico dice perrita/);
  const fast = goalProgress(goals, { fastOk: 3, byType: { fuerza: 1 } });
  assert.equal(forecastLevel(fast.items).key, "dios"); // a este ritmo completa todo
});

test("hitos de racha: 7 días de ayuno, 4 semanas de fierritos (lunes)", () => {
  assert.deepEqual(coachNotifications(base(at("2026-11-25T12:05:00"), { fastStreak: 7 })).map((n) => n.ref), ["ayuno-7-2026-11-25"]);
  assert.equal(coachNotifications(base(at("2026-11-25T12:05:00"), { fastStreak: 8 })).length, 0);
  assert.equal(coachNotifications(base(at("2026-11-25T12:05:00"), { fastStreak: 7, fasting: false })).length, 0);
  assert.deepEqual(coachNotifications(base(at("2026-11-23T12:05:00"), { strengthRun: 4 })).map((n) => n.ref), ["fierritos-4-2026-11-23"]);
});

test("¿dónde andás?: 3 días sin anotar, una vez por semana", () => {
  const now = at("2026-11-26T18:05:00");
  const due = coachNotifications(base(now, { lastActivity: at("2026-11-22T20:00:00").toISOString() }));
  assert.deepEqual(due.map((n) => [n.kind, n.ref]), [["idle", "2026-11-23"]]);
  assert.equal(coachNotifications(base(now, { lastActivity: at("2026-11-24T20:00:00").toISOString() })).length, 0);
  assert.equal(coachNotifications(base(now, { lastActivity: at("2026-11-22T20:00:00").toISOString(), sent: new Set(["idle|2026-11-23"]) })).length, 0);
  const msg = buildMessage("idle", {}, ["diosa"], null, r0);
  assert.match(msg.body, /^Hola, diosa perdida 👀/);
});

test("lunes 12:30: cerró el ranking (ganadora o puesto); sin Club, nada", () => {
  const last = { weekStart: "2026-11-16", score: 78, level: "crack" as const };
  const now = at("2026-11-23T12:35:00");
  const rest = coachNotifications(base(now, { last, club: { pos: 3, total: 5, winner: "Juli" } }), r0);
  assert.deepEqual(rest.map((n) => n.kind), ["club_podium"]);
  assert.match(String(rest[0].vars.linea), /ganó Juli 👑 y vos quedaste 3ª/);
  const won = coachNotifications(base(now, { last, club: { pos: 1, total: 5, winner: "Sabri" } }), r0);
  assert.match(String(won[0].vars.linea), /GANASTE/);
  assert.equal(coachNotifications(base(now, { last })).length, 0);
});

test("domingo 21:00: último sprint del Club", () => {
  const now = at("2026-11-22T21:05:00");
  const chasing = coachNotifications(base(now, { clubLive: { pos: 2, total: 4, above: { name: "Juli", gap: 6 } } }), r0);
  assert.deepEqual(chasing.map((n) => [n.kind, n.ref]), [["club_closing", "2026-11-16"]]);
  assert.match(String(chasing[0].vars.linea), /vas 2ª y estás a 6 pts de Juli/);
  const first = coachNotifications(base(now, { clubLive: { pos: 1, total: 4, above: null } }), r0);
  assert.match(String(first[0].vars.linea), /PRIMERA/);
  // sola en el Club: no tiene gracia
  assert.equal(coachNotifications(base(now, { clubLive: { pos: 1, total: 1, above: null } })).length, 0);
});
