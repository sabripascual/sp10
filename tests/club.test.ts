import assert from "node:assert/strict";
import { test } from "node:test";
import { changeText, closedRanking, figuritaNumber, liveSteps, passedBy, pointsToNextLevel, weekAwards, type ClubMember } from "../src/lib/club";
import { levelFor } from "../src/lib/level";

const m = (id: string, closed: number | null, live: number, x: Partial<ClubMember> = {}): ClubMember => ({
  id,
  name: id,
  avatar: null,
  isMe: false,
  closed: closed === null ? null : { score: closed, level: levelFor(closed).key, pct: closed },
  prev: null,
  live: { score: live, level: levelFor(live).key, pct: live },
  liveYesterday: null,
  ...x,
});

test("ranking de la semana cerrada y premios", () => {
  const ms = [
    m("Caro", 76, 10),
    m("Juli", 94, 20),
    m("Meli", 64, 5, { prev: { score: 30, level: "vagoneta" } }),
    m("Flor", 18, 0),
    m("Nueva", null, 40),
  ];
  assert.deepEqual(closedRanking(ms).map((x) => x.id), ["Juli", "Caro", "Meli", "Flor"]);
  assert.deepEqual(weekAwards(ms).map((a) => [a.key, a.who.id]), [["picante", "Juli"], ["remontada", "Meli"], ["sillon", "Flor"]]);
  // con 2 no hay sillón de oro
  assert.deepEqual(weekAwards([m("A", 80, 0), m("B", 20, 0)]).map((a) => a.key), ["picante"]);
});

test("escalones en vivo: de nivel dios a pajera, con flechita desde ayer", () => {
  const ms = [m("Juli", null, 92, { liveYesterday: { score: 70, level: "motivada" } }), m("Vos", null, 78, { isMe: true, liveYesterday: { score: 80, level: "crack" } })];
  const steps = liveSteps(ms);
  assert.equal(steps[0].level.key, "dios");
  assert.deepEqual(steps[0].people.map((p) => [p.member.id, p.move]), [["Juli", "up"]]);
  assert.deepEqual(steps[1].people.map((p) => [p.member.id, p.move]), [["Vos", "same"]]);
  assert.equal(steps[5].level.key, "pajera");
});

test("te pasó: alguien que ayer estaba atrás y hoy adelante", () => {
  const ms = [
    m("Vos", null, 60, { isMe: true, liveYesterday: { score: 55, level: "promedio" } }),
    m("Juli", null, 65, { liveYesterday: { score: 50, level: "promedio" } }),
    m("Caro", null, 70, { liveYesterday: { score: 70, level: "motivada" } }),
  ];
  assert.equal(passedBy(ms)?.id, "Juli");
  assert.equal(passedBy([ms[0], ms[2]]), null);
});

test("figurita: número estable, texto de cambio y puntos al próximo escalón", () => {
  assert.equal(figuritaNumber("abc"), figuritaNumber("abc"));
  assert.match(figuritaNumber("abc"), /^\d{2}$/);
  assert.equal(changeText("crack", "motivada"), "Subiste de Motivada a Crack, esaaa 📈");
  assert.equal(changeText("motivada", "crack"), "Bajaste un escalón, nada que unos fierritos no arreglen");
  assert.match(changeText("crack", null), /primera figurita/);
  assert.deepEqual(pointsToNextLevel(70), { level: levelFor(75), pts: 5 });
  assert.equal(pointsToNextLevel(95), null);
});
