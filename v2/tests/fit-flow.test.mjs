import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newFlow, nextScreen, previousScreen, withAnswer, skipToResult, continueSolo, progress } from "../js/fit-page/flow.js";
import { buildBed } from "../js/fit-page/build-bed.js";

const beds = JSON.parse(fs.readFileSync(new URL("../data/beds.json", import.meta.url), "utf8"));

test("the full two-person path visits every screen in order", () => {
  let flow = newFlow();
  const seen = [];
  for (let step = 0; step < 20 && flow.screen !== "result"; step++) { seen.push(`${flow.screen}${flow.sleeper}`); flow = nextScreen(flow); }
  assert.deepEqual(seen, ["intro0", "pose0", "build0", "pain0", "partner0", "pose1", "build1", "pain1"]);
  assert.equal(flow.screen, "result");
});

test("back from every screen returns to the screen before it", () => {
  let flow = newFlow();
  while (flow.screen !== "result") {
    const next = nextScreen(flow), back = previousScreen(next);
    assert.equal(back.screen, flow.screen);
    assert.equal(back.sleeper, flow.sleeper);
    flow = next;
  }
});

test("progress only ever moves forward", () => {
  let flow = newFlow(), last = -1;
  while (flow.screen !== "result") { assert.ok(progress(flow) > last); last = progress(flow); flow = nextScreen(flow); }
  assert.equal(progress(flow), 1);
});

test("answers are stored for the sleeper on screen only", () => {
  let flow = withAnswer({ ...newFlow(), screen: "pose", sleeper: 1 }, "pose", "side");
  assert.equal(flow.answers[1].pose, "side");
  assert.equal(flow.answers[0].pose, null);
});

test("two different sleepers get two different sides", () => {
  let flow = newFlow();
  flow.answers = [{ pose: "side", build: "lighter", pain: ["shoulders"] }, { pose: "stomach", build: "heavier", pain: ["back"] }];
  const bed = buildBed({ ...flow, screen: "result" }, beds);
  assert.equal(bed.sameBothSides, false);
  assert.ok(bed.line.name);
  bed.sides.forEach(side => assert.ok(side.prebuild.name));
});

test("skip and solo give a mirrored bed", () => {
  assert.equal(buildBed(skipToResult(newFlow()), beds).sameBothSides, true);
  const solo = continueSolo(withAnswer({ ...newFlow(), screen: "pose" }, "pose", "side"));
  assert.equal(buildBed(solo, beds).sameBothSides, true);
});

test("engineer path: questions end on the tuning screen, then the result", async () => {
  const { startEngineer } = await import("../js/fit-page/flow.js");
  let flow = startEngineer(newFlow());
  assert.equal(flow.screen, "pose");
  for (let step = 0; step < 20 && flow.screen !== "tune"; step++) flow = nextScreen(flow);
  assert.equal(flow.screen, "tune");
  assert.equal(nextScreen(flow).screen, "result");
  assert.equal(previousScreen(flow).screen, "result");
});

test("changing one block by hand changes only that block and can be undone", async () => {
  const { openTuning, withZoneLevel, resetTuning } = await import("../js/fit-page/flow.js");
  let flow = newFlow();
  flow.answers = [{ pose: "side", build: "lighter", pain: [] }, { pose: "back", build: "average", pain: [] }];
  flow = openTuning({ ...flow, screen: "result" });
  const before = buildBed(flow, beds);
  const other = before.sides[0].comfort[1] === "Firm" ? "Plush" : "Firm";
  flow = withZoneLevel(flow, 0, "comfort", 1, other, before.sides[0]);
  const after = buildBed(flow, beds);
  assert.equal(after.sides[0].comfort[1], other);
  assert.equal(after.sides[0].comfort[0], before.sides[0].comfort[0]);
  assert.deepEqual(after.sides[0].support, before.sides[0].support);
  assert.deepEqual(after.sides[1].comfort, before.sides[1].comfort);
  assert.equal(after.sides[0].isTuned, true);
  assert.ok(after.sides[0].hint);
  assert.deepEqual(buildBed(resetTuning(flow, 0), beds).sides[0].comfort, before.sides[0].comfort);
});

test("a hand-tuned zone moves the bed to an in-store line", async () => {
  const { withZoneLevel } = await import("../js/fit-page/flow.js");
  let flow = skipToResult(newFlow());
  const side = buildBed(flow, beds).sides[0];
  flow = withZoneLevel(flow, 0, "support", 0, side.support[0] === "Medium" ? "Extra Firm" : "Medium", { comfort: ["Medium", "Medium", "Medium"], support: [side.support[0], side.support[0], side.support[0]] });
  assert.equal(buildBed(flow, beds).line.where, "in store");
});

test("height and weight sharpen the sleeper, and old saved flows still build", async () => {
  const { withBody } = await import("../js/fit-page/flow.js");
  let flow = { ...newFlow(), screen: "result" };
  flow.answers = [{ pose: "side", build: "average", pain: [] }, { pose: "side", build: "average", pain: [] }];
  flow = withBody(flow, 0, { height: 74, weight: 260 });
  const bed = buildBed(flow, beds);
  assert.deepEqual(bed.sides[0].sleeper, { height: 74, weight: 260 });
  assert.notDeepEqual(bed.sides[1].sleeper, bed.sides[0].sleeper);
  assert.equal(withBody(flow, 0, { height: null, weight: null }).body[0], null);
  const { body, tuned, engineer, ...oldFlow } = flow;
  assert.ok(buildBed(oldFlow, beds).line.name);
});

test("counts how many blocks the ready-made bed changes", async () => {
  const { blocksDifferent } = await import("../js/fit/bed-lines.js");
  const prebuild = { contour: "medium", support: "F" };
  assert.equal(blocksDifferent({ comfort: ["Medium", "Medium", "Medium"], support: ["Firm", "Firm", "Firm"] }, prebuild), 0);
  assert.equal(blocksDifferent({ comfort: ["Plush", "Medium", "Medium"], support: ["Firm", "Extra Firm", "Firm"] }, prebuild), 2);
});
