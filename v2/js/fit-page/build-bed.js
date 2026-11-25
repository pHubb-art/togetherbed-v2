/**
 * Turns the flow's answers into a finished bed: both sides, the product line
 * and the closest pre-build for each side.
 */
import { sleeperFromQuickAnswers } from "../fit/quick-path.js";
import { recommend } from "../fit/recommend.js";
import { zoneSinks } from "../fit/pressure.js";
import { bestPillow } from "../fit/pillow.js";
import { alignment } from "../fit/alignment.js";
import { lineForBed, closestPrebuild } from "../fit/bed-lines.js";

/** Quick answers plus any height and weight the sleeper gave on the tuning screen. */
function sleeperFor(answers, body) {
  const sleeper = sleeperFromQuickAnswers(answers);
  if (body?.height) sleeper.height = body.height;
  if (body?.weight) sleeper.weight = body.weight;
  return sleeper;
}

/**
 * One side of the bed.
 * @param tuned  hand-picked { comfort, support }, or null to use the suggestion
 */
function buildSide(answers, body, tuned, prebuilds) {
  const sleeper = sleeperFor(answers, body);
  const suggested = recommend(sleeper);
  const levels = tuned
    ? { comfort: tuned.comfort, support: tuned.support, pillow: bestPillow(sleeper, zoneSinks(sleeper, tuned)) }
    : suggested;
  const fit = alignment(sleeper, zoneSinks(sleeper, levels), null, levels.pillow);
  return {
    ...levels,
    alignment: fit.label,
    alignmentRank: fit.rank,     // 0 is best
    hint: fit.hint,
    isTuned: Boolean(tuned),
    sleeper: { height: sleeper.height, weight: sleeper.weight },
    prebuild: closestPrebuild(levels, prebuilds)
  };
}

/**
 * @param flow     the Sleep Fit flow (see flow.js)
 * @param bedData  contents of data/beds.json
 * @returns { sides: [left, right], line, sameBothSides }
 */
export function buildBed(flow, bedData) {
  const answers = flow.skipped ? [{}, {}] : flow.answers;
  const body = flow.body || [null, null], tuned = flow.tuned || [null, null];
  const first = buildSide(answers[0], body[0], tuned[0], bedData.prebuilds);
  const second = flow.solo ? first : buildSide(answers[1], body[1], tuned[1], bedData.prebuilds);
  const sides = [first, second];
  const sameBothSides = JSON.stringify([first.comfort, first.support]) === JSON.stringify([second.comfort, second.support]);
  return { sides, line: bedData.lines.find(line => line.id === lineForBed(sides)), sameBothSides };
}
