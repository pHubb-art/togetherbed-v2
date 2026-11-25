/**
 * Proves the v2 Sleep Fit engine gives the same answers as the existing site.
 * It runs the original logic straight out of ../../index.html and compares
 * both engines across a wide grid of sleepers.
 * Run: npm test (inside the v2 folder)
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { recommend } from "../js/fit/recommend.js";
import { zoneSinks } from "../js/fit/pressure.js";
import { alignment } from "../js/fit/alignment.js";

function loadOriginalEngine() {
  const html = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const start = html.indexOf("/* Sleepers: body shape drives the recommended comfort per zone */");
  const end = html.indexOf("const ROWS = [");
  assert.ok(start > 0 && end > start, "Sleep Fit logic not found in index.html");
  const stubs = `
    const FIRMNESS = { Plush: 1, Medium: 1, Firm: 1 };
    const SUPPORT = { Medium: 1, Firm: 1, "Extra Firm": 1 };
    const CUBE = {}, COIL = {}, firm = {}, support = {};`;
  const exports = ";({ recommend, zoneSinks, alignment })";
  return vm.runInNewContext(stubs + html.slice(start, end) + exports);
}

function* sleeperGrid() {
  const painSets = [[], ["neck"], ["shoulders"], ["back"], ["hips"], ["knees"], ["back", "hips"], ["neck", "shoulders", "knees"]];
  for (const kind of ["female", "male", "neutral"])
    for (const pose of ["back", "side", "stomach"])
      for (const sh of [0.1, 0.45, 0.9]) for (const hip of [0.1, 0.5, 0.9])
        for (const curve of [0.2, 0.6]) for (const legs of [0.4, 0.8])
          for (const [height, weight] of [[60, 105], [66, 160], [72, 250], [70, 330]])
            for (const pain of painSets)
              yield { kind, pose, sh, hip, curve, bust: 0.5, legs, height, weight, hwSkip: false, pain };
}

const plain = value => JSON.parse(JSON.stringify(value));

test("v2 recommendations match the existing site for every sleeper in the grid", () => {
  const original = loadOriginalEngine();
  let count = 0;
  for (const sleeper of sleeperGrid()) {
    const expected = plain(original.recommend({ ...sleeper, pain: [...sleeper.pain] }, null));
    assert.deepEqual(recommend(sleeper), expected, JSON.stringify(sleeper));
    count++;
  }
  assert.ok(count > 10000);
});

test("v2 sink depths and alignment ratings match the existing site", () => {
  const original = loadOriginalEngine();
  const levels = { comfort: ["Plush", "Medium", "Firm"], support: ["Firm", "Extra Firm", "Medium"] };
  const measured = { sh: 0.23, hip: 0.17, gap: { back: 0.04, side: 0.13, stomach: 0.02 } };
  for (const sleeper of sleeperGrid()) {
    if (sleeper.pain.length) continue;
    const theirs = original.zoneSinks(sleeper, levels), ours = zoneSinks(sleeper, levels);
    assert.deepEqual(ours.total, plain(theirs.t));
    for (const pillow of [undefined, "Thin", "Medium", "Thick"]) {
      const a = original.alignment(sleeper, theirs, measured, pillow), b = alignment(sleeper, ours, measured, pillow);
      assert.equal(b.error, a.err);
      assert.equal(b.label, a.label);
      assert.equal(b.hint, a.hint);
    }
  }
});

test("a skipped height and weight falls back to defaults", () => {
  const original = loadOriginalEngine();
  const sleeper = { kind: "neutral", pose: "side", sh: 0.52, hip: 0.5, curve: 0.48, bust: 0.5, legs: 0.52, height: 1, weight: 1, hwSkip: true, pain: [] };
  assert.deepEqual(recommend(sleeper), plain(original.recommend({ ...sleeper }, null)));
});
