/**
 * Explains a recommendation in plain words: for each zone, which of the
 * sleeper's answers shaped it. Returns reason ids only; the sentences live in
 * data/copy.json ("fit.explain") so they can be edited without code.
 *
 * The sentences describe what the body needs. They are drafts until the
 * product team has checked them.
 */

/** Zone order matches the bed: shoulders, hips, legs. */
export const EXPLAIN_ZONES = ["shoulders", "hips", "legs"];

/**
 * @param answers { pose, build, pain: [] } from the quick questions (any may be missing)
 * @returns { shoulders: [ids], hips: [ids], legs: [ids] }
 */
export function reasonsFor(answers = {}) {
  const pain = answers.pain || [];
  const reasons = { shoulders: [], hips: [], legs: [] };

  if (answers.pose) {
    reasons.shoulders.push(`pose-${answers.pose}`);
    reasons.hips.push(`pose-${answers.pose}`);
  }
  if (answers.build === "lighter" || answers.build === "heavier") reasons.hips.push(`build-${answers.build}`);

  if (pain.includes("shoulders")) reasons.shoulders.push("pain-shoulders");
  if (pain.includes("neck")) reasons.shoulders.push("pain-neck");
  if (pain.includes("back")) reasons.hips.push("pain-back");
  if (pain.includes("hips")) reasons.hips.push("pain-hips");
  if (pain.includes("knees")) reasons.legs.push("pain-knees");

  if (answers.pose) reasons.legs.unshift("steady");
  for (const zone of EXPLAIN_ZONES) if (!reasons[zone].length) reasons[zone].push("start");
  return reasons;
}
