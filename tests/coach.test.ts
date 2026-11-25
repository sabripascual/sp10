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
  current: { pct: 0, items: [] },
  fastStreak: 3,
  strengthRun: 0,
  lastActivity: at("2026-11-23T10:00:00").toISOString(),
  createdDate: "2026-11-01",
  ...x,
});
const r0 = () => 0;

test("lunes 9:30: salió tu nivel, con subida y puesto en el Club", () => {
  const due = coachNotifications(
    base(at("2026-11-23T09:35:00"), { last: { weekStart: "2026-11-16", score: 78, level: "crack" }, prev: { level: "motivada" }, club: { pos: 2, total: 5 } }),
    r0,
  );
  assert.equal(due.length, 1);
  const msg = buildMessage(due[0].kind, due[0].vars, ["reina"], null, r0);
  assert.equal(msg.body, "⚡ Perrita crack, reina: 78 pts. Ni el Dibu ataja tanta constancia. Subiste de motivada a crack, esaaa 📈 Quedaste 2ª de 5 en el Club 🏆");
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
