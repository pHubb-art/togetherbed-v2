import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { QUICK_QUESTIONS, sleeperFromQuickAnswers } from "../js/fit/quick-path.js";
import { recommend } from "../js/fit/recommend.js";
import { lineForSide, lineForBed, closestPrebuild } from "../js/fit/bed-lines.js";
import { COMFORT_LEVELS, SUPPORT_LEVELS } from "../js/fit/constants.js";

const beds = JSON.parse(fs.readFileSync(new URL("../data/beds.json", import.meta.url), "utf8"));

test("every quick answer combination gives a valid recommendation and pre-build", () => {
  for (const pose of QUICK_QUESTIONS.pose) for (const build of QUICK_QUESTIONS.build)
    for (const pain of [[], ...QUICK_QUESTIONS.pain.map(area => [area])]) {
      const side = recommend(sleeperFromQuickAnswers({ pose, build, pain }));
      side.comfort.forEach(feel => assert.ok(COMFORT_LEVELS.includes(feel)));
      side.support.forEach(feel => assert.ok(SUPPORT_LEVELS.includes(feel)));
      assert.ok(["Thin", "Medium", "Thick"].includes(side.pillow));
      assert.ok(closestPrebuild(side, beds.prebuilds), "a pre-build is always found");
    }
});

test("a heavier build never gets softer support than a lighter one", () => {
  for (const pose of QUICK_QUESTIONS.pose) {
    const rank = build => recommend(sleeperFromQuickAnswers({ pose, build })).support
      .reduce((sum, feel) => sum + SUPPORT_LEVELS.indexOf(feel), 0);
    assert.ok(rank("heavier") >= rank("lighter"), pose);
  }
});

test("skipping every question still works", () => {
  assert.ok(recommend(sleeperFromQuickAnswers()).pillow);
});

test("line rule: one feel = line 1, zoned comfort = line 2, zoned support = line 3", () => {
  const one = { comfort: ["Medium", "Medium", "Medium"], support: ["Firm", "Firm", "Firm"] };
  const two = { comfort: ["Plush", "Medium", "Medium"], support: ["Firm", "Firm", "Firm"] };
  const three = { comfort: ["Plush", "Medium", "Medium"], support: ["Medium", "Firm", "Firm"] };
  assert.equal(lineForSide(one), 1);
  assert.equal(lineForSide(two), 2);
  assert.equal(lineForSide(three), 3);
  assert.equal(lineForBed([one, three]), 3);
  assert.equal(lineForBed([one, one]), 1);
});

test("closest pre-build matches a uniform side exactly", () => {
  const side = { comfort: ["Firm", "Firm", "Firm"], support: ["Firm", "Firm", "Firm"] };
  const match = closestPrebuild(side, beds.prebuilds);
  assert.equal(match.contour, "firm");
  assert.equal(match.support, "F");
});
