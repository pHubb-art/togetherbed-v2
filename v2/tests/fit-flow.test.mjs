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
