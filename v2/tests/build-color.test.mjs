import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { MATERIALS, FEELS, mixPanes, buildCode } from "../js/fit/build-color.js";
import { panesSoFar, buildColor } from "../js/fit-page/build-panes.js";
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

test("each answer lays one more pane, four in all for two sleepers", () => {
  let flow = nextScreen(newFlow());
  const count = () => panesSoFar(flow, buildBed(flow, beds)).length;
  assert.equal(count(), 0);
  flow = withAnswer(flow, "pose", "side"); assert.equal(count(), 1);
  flow = withAnswer(flow, "build", "lighter"); assert.equal(count(), 2);
  flow = withAnswer({ ...flow, sleeper: 1 }, "pose", "back"); assert.equal(count(), 3);
  flow = withAnswer(flow, "build", "heavier"); assert.equal(count(), 4);
  const color = buildColor({ ...flow, screen: "result" }, buildBed(flow, beds));
  assert.match(color.hex, /^#[0-9A-F]{6}$/);
  assert.match(color.number, /^1\d·4\d \/ 1\d·5\d$/);
  assert.equal(panesSoFar(skipToResult(newFlow()), buildBed(skipToResult(newFlow()), beds)).length, 4);
});
