/**
 * Quick path: three answers per sleeper instead of the full body sliders.
 * The answers are turned into a sleeper profile and run through the same
 * engine as the engineer path, so both paths always agree.
 */
import { KIND_DEFAULTS } from "./constants.js";
import { createSleeper } from "./sleeper.js";

/** The three quick questions. Labels are placeholders until copy comes from the CMS. */
export const QUICK_QUESTIONS = {
  pose:  ["back", "side", "stomach"],
  build: ["lighter", "average", "heavier"],
  pain:  ["neck", "shoulders", "back", "hips", "knees"]
};

/** Weight change (as a share of the default weight) for each build answer. */
const BUILD_WEIGHT_SHIFT = { lighter: -0.18, average: 0, heavier: 0.25 };

/**
 * @param answers { pose, build, pain: [], kind? } where kind is optional and defaults to "neutral"
 * @returns a full sleeper profile ready for recommend()
 */
export function sleeperFromQuickAnswers(answers = {}) {
  const kind = answers.kind || "neutral";
  const shift = BUILD_WEIGHT_SHIFT[answers.build] ?? 0;
  return createSleeper({
    kind,
    pose: answers.pose || "back",
    weight: Math.round(KIND_DEFAULTS[kind].weight * (1 + shift)),
    pain: [...(answers.pain || [])]
  });
}
