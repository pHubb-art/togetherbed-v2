/**
 * Sleeper helpers: read height, weight and pain points from a sleeper profile.
 *
 * A sleeper profile looks like:
 *   { kind: "female" | "male" | "neutral", pose: "back" | "side" | "stomach",
 *     sh, hip, curve, legs,          // body sliders, 0 to 1
 *     height, weight, hwSkip,        // inches, pounds, true when skipped
 *     pain: ["neck", "shoulders", "back", "hips", "knees"] }
 */
import { KIND_DEFAULTS } from "./constants.js";

/** Build a full sleeper profile from a few answers, filling the rest with defaults. */
export function createSleeper(answers = {}) {
  const kind = answers.kind || "neutral";
  return { kind, pose: "back", hwSkip: false, pain: [], ...KIND_DEFAULTS[kind], ...answers };
}

export function heightInches(sleeper) {
  return sleeper.hwSkip ? KIND_DEFAULTS[sleeper.kind].height : sleeper.height;
}

export function weightPounds(sleeper) {
  return sleeper.hwSkip ? KIND_DEFAULTS[sleeper.kind].weight : sleeper.weight;
}

export function bodyMassIndex(sleeper) {
  return 703 * weightPounds(sleeper) / Math.pow(heightInches(sleeper), 2);
}

/** True when the sleeper reported pain in this area. */
export function hurts(sleeper, area) {
  return (sleeper.pain || []).includes(area);
}
