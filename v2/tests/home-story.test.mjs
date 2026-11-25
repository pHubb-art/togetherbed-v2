import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CHAPTERS, PARTS, poseAt } from "../js/home/chapter-layout.js";
import { chapterProgress } from "../js/home/scroll-progress.js";

const copy = JSON.parse(fs.readFileSync(new URL("../data/copy.json", import.meta.url), "utf8"));

test("there is one bed pose for every chapter of copy", () => {
  assert.equal(CHAPTERS.length, copy.home.chapters.length);
});

test("whole-number progress gives exactly that chapter's pose", () => {
  CHAPTERS.forEach((chapter, index) => {
    const pose = poseAt(index);
    for (const part of PARTS) assert.deepEqual(pose.offsets[part], chapter.offsets[part] || [0, 0, 0]);
    assert.equal(pose.yaw, chapter.yaw);
  });
});

test("the story starts and ends with the bed closed", () => {
  for (const pose of [poseAt(0), poseAt(CHAPTERS.length - 1), poseAt(-3), poseAt(99)])
    for (const part of PARTS) assert.deepEqual(pose.offsets[part], [0, 0, 0]);
});

test("between chapters every part sits between its two poses", () => {
  const pose = poseAt(2.5);
  assert.ok(pose.offsets.cover[1] > 0.22 && pose.offsets.cover[1] < 1.26);
});

test("scroll position maps to a chapter number", () => {
  const boxes = tops => tops.map(top => ({ getBoundingClientRect: () => ({ top, height: 800 }) }));
  assert.equal(chapterProgress(boxes([0, 800, 1600]), 800), 0);
  assert.equal(chapterProgress(boxes([-800, 0, 800]), 800), 1);
  assert.equal(chapterProgress(boxes([-400, 400, 1200]), 800), 0.5);
  assert.equal(chapterProgress(boxes([-5000, -4200, -3400]), 800), 2);
});
