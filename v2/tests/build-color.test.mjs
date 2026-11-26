import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { MATERIALS, FEELS, mixPanes, buildCode } from "../js/fit/build-color.js";
import { pairsSoFar, stacksSoFar, zoneColors, buildColor } from "../js/fit-page/build-panes.js";
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

test("each answer colors that sleeper's shape in every zone, and the color changes as they answer", () => {
  let flow = nextScreen(newFlow());
  const pairs = () => pairsSoFar(flow, buildBed(flow, beds));
  assert.deepEqual(pairs(), [0, 1, 2].map(() => ({ left: null, right: null })));
  flow = withAnswer(flow, "pose", "side");
  const afterPose = pairs();
  assert.deepEqual(stacksSoFar(newFlow(), buildBed(newFlow(), beds)).map(zone => [zone.left.length, zone.right.length]), [[2, 2], [2, 2], [2, 2]]);
  afterPose.forEach(pair => { assert.match(pair.left, /^#[0-9A-F]{6}$/); assert.equal(pair.right, null); });
  flow = withAnswer(flow, "build", "lighter");
  stacksSoFar(flow, buildBed(flow, beds)).forEach(zone => {
    assert.equal(zone.left.length, 2); assert.equal(zone.left[0].color, MATERIALS.coil.color);
    assert.deepEqual(zone.right.map(card => card.opacity), [FEELS.medium.opacity, FEELS.medium.opacity], "the sleeper who has not answered keeps the generic bed");
  });
  flow = withAnswer({ ...flow, sleeper: 1 }, "pose", "back");
  pairs().forEach(pair => assert.match(pair.right, /^#[0-9A-F]{6}$/));

  const bed = buildBed({ ...flow, screen: "result" }, beds);
  assert.match(buildColor({ ...flow, screen: "result" }, bed).number, /^1\d·4\d \/ 1\d·5\d$/);
  zoneColors(bed.sides[0], 0).forEach(hex => assert.match(hex, /^#[0-9A-F]{6}$/));
  pairsSoFar({ ...skipToResult(newFlow()), solo: true }, bed).forEach(pair => assert.equal("right" in pair, false));
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
