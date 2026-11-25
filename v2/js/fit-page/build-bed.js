/**
 * Turns the flow's answers into a finished bed: both sides, the product line
 * and the closest pre-build for each side.
 */
import { sleeperFromQuickAnswers } from "../fit/quick-path.js";
import { recommend } from "../fit/recommend.js";
import { zoneSinks } from "../fit/pressure.js";
import { alignment } from "../fit/alignment.js";
import { lineForBed, closestPrebuild } from "../fit/bed-lines.js";

function buildSide(answers, prebuilds) {
  const sleeper = sleeperFromQuickAnswers(answers);
  const levels = recommend(sleeper);
  const fit = alignment(sleeper, zoneSinks(sleeper, levels), null, levels.pillow);
  return { ...levels, alignment: fit.label, prebuild: closestPrebuild(levels, prebuilds) };
}

/**
 * @param flow     the Sleep Fit flow (see flow.js)
 * @param bedData  contents of data/beds.json
 * @returns { sides: [left, right], line, sameBothSides }
 */
export function buildBed(flow, bedData) {
  const first = buildSide(flow.skipped ? {} : flow.answers[0], bedData.prebuilds);
  const second = flow.skipped || flow.solo ? first : buildSide(flow.answers[1], bedData.prebuilds);
  const sides = [first, second];
  const sameBothSides = JSON.stringify([first.comfort, first.support]) === JSON.stringify([second.comfort, second.support]);
  return { sides, line: bedData.lines.find(line => line.id === lineForBed(sides)), sameBothSides };
}
