import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { MATERIALS, FEELS, mixPanes, buildCode } from "../js/fit/build-color.js";
import { bedSoFar, zoneColors, buildColor } from "../js/fit-page/build-panes.js";
import { buildBed } from "../js/fit-page/build-bed.js";
import { newFlow, nextScreen, withAnswer, skipToResult } from "../js/fit-page/flow.js";

const beds = JSON.parse(fs.readFileSync(new URL("../data/beds.json", import.meta.url), "utf8"));

test("mixes panes into the paint-chip color and number", () => {
  const panes = [{ material: "coil", feel: "firm" }, { material: "latex", feel: "medium" }, { material: "memory", feel: "plush" }];
  assert.equal(buildCode(panes), "12·33·44");
  assert.match(mixPanes(panes), /^#[0-9A-F]{6}$/);
  assert.equal(mixPanes([]), "#FFFFFF");
});

test("matches the design system library when it is available", t => {
  const library = "/mnt/project-files/design-system/color-glass.js";
  if (!fs.existsSync(library)) return t.skip("design system file not on this machine");
  const sandbox = { window: {}, document: undefined }; sandbox.self = sandbox.window;
  vm.runInNewContext(fs.readFileSync(library, "utf8"), sandbox);
  const TBColor = sandbox.window.TBColor || sandbox.TBColor;
  for (const material of Object.keys(MATERIALS)) for (const feel of Object.keys(FEELS)) {
    const panes = [{ material: "coil", feel: "firm" }, { material, feel }];
    assert.equal(mixPanes(panes), TBColor.mix(panes), `${material} ${feel}`);
    assert.equal(buildCode(panes), TBColor.code(panes), `${material} ${feel}`);
  }
});

test("each answer adds a pane to every zone of that sleeper's side", () => {
  let flow = nextScreen(newFlow());
  const perZone = () => bedSoFar(flow, buildBed(flow, beds)).map(side => side.map(zone => zone.length));
  assert.deepEqual(perZone(), [[0, 0, 0], [0, 0, 0]]);
  flow = withAnswer(flow, "pose", "side"); assert.deepEqual(perZone(), [[1, 1, 1], [0, 0, 0]]);
  flow = withAnswer(flow, "build", "lighter"); assert.deepEqual(perZone(), [[2, 2, 2], [0, 0, 0]]);
  flow = withAnswer({ ...flow, sleeper: 1 }, "pose", "back"); assert.deepEqual(perZone(), [[2, 2, 2], [1, 1, 1]]);
  flow = withAnswer(flow, "build", "heavier"); assert.deepEqual(perZone(), [[2, 2, 2], [2, 2, 2]]);

  const bed = buildBed({ ...flow, screen: "result" }, beds);
  const color = buildColor({ ...flow, screen: "result" }, bed);
  assert.match(color.number, /^1\d·4\d \/ 1\d·5\d$/);
  zoneColors(bed.sides[0], 0).forEach(hex => assert.match(hex, /^#[0-9A-F]{6}$/));
  assert.equal(bedSoFar({ ...skipToResult(newFlow()), solo: true }, bed).length, 1);
});

test("every reason the explanation can give has a sentence in the copy", async () => {
  const { reasonsFor, EXPLAIN_ZONES } = await import("../js/fit/explain.js");
  const copy = JSON.parse(fs.readFileSync(new URL("../data/copy.json", import.meta.url), "utf8"));
  const pains = ["neck", "shoulders", "back", "hips", "knees"];
  for (const pose of [undefined, "back", "side", "stomach"]) for (const build of [undefined, "lighter", "average", "heavier"]) {
    const reasons = reasonsFor({ pose, build, pain: pains });
    for (const zone of EXPLAIN_ZONES) {
      assert.ok(reasons[zone].length > 0);
      for (const id of reasons[zone]) assert.ok(copy.fit.explain[zone][id], `${zone} ${id}`);
    }
  }
  assert.deepEqual(reasonsFor({}), { shoulders: ["start"], hips: ["start"], legs: ["start"] });
  assert.ok(reasonsFor({ pose: "side", pain: ["shoulders"] }).shoulders.includes("pain-shoulders"));
});
