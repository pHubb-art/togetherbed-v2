/**
 * Sleep Fit recommendation.
 * Step 1: a body-shape rule gives a starting point for each zone.
 * Step 2: try every shoulder and hip combination and keep the one that keeps
 *         the spine straightest, staying close to the starting point.
 */
import { COMFORT_LEVELS, SUPPORT_LEVELS } from "./constants.js";
import { bodyMassIndex, hurts } from "./sleeper.js";
import { zoneSinks } from "./pressure.js";
import { alignment } from "./alignment.js";
import { bestPillow } from "./pillow.js";

/** How each sleep position shifts comfort and support at shoulders and hips. */
const POSITION_SHIFT = {
  back:    { sh: 0,     hip: 0,     supSh: 0,     supHip: 0 },
  side:    { sh: 0.22,  hip: 0.14,  supSh: -0.06, supHip: 0 },
  stomach: { sh: -0.14, hip: -0.32, supSh: 0,     supHip: 0.2 }
};

const comfortFor = score => score > 0.62 ? "Plush" : score > 0.36 ? "Medium" : "Firm";
const supportFor = score => score > 0.66 ? "Extra Firm" : score > 0.38 ? "Firm" : "Medium";

/**
 * Starting point from body shape, position, weight and pain.
 * Broader shoulders, wider hips and a curvier seat press deeper, so they get more
 * relief on top and firmer coils underneath.
 */
export function recommendFromShape(sleeper) {
  const shift = POSITION_SHIFT[sleeper.pose] || {};
  const kindShoulders = sleeper.kind === "male" ? 0.12 : sleeper.kind === "neutral" ? 0.06 : 0;
  const kindHips = sleeper.kind === "female" ? 0.12 : sleeper.kind === "neutral" ? 0.06 : 0;
  // Heavier builds sink further: slightly firmer comfort, noticeably firmer support.
  const weightScore = Math.max(-6, Math.min(30, bodyMassIndex(sleeper) - 24));
  const shoulders = sleeper.sh + kindShoulders;
  const hips = sleeper.hip + (sleeper.curve - 0.5) * 0.6 + kindHips;

  let legsComfort = (sleeper.kind === "male" && sleeper.hip < 0.4) || sleeper.pose === "stomach" ? "Firm" : "Medium";
  if (hurts(sleeper, "knees")) legsComfort = legsComfort === "Firm" ? "Medium" : "Plush";   // softer under sore knees

  // Pain: shoulders and hips get more relief; a sore lower back gets firmer support under the hips.
  const painShoulders = hurts(sleeper, "shoulders") ? 0.28 : 0;
  const painHips = hurts(sleeper, "hips") ? 0.22 : 0;
  const painBack = hurts(sleeper, "back") ? 1 : 0;
  const legsSupport = weightScore > 16 ? "Extra Firm"
    : sleeper.legs > 0.72 || weightScore > 6 || sleeper.kind === "male" ? "Firm" : "Medium";

  return {
    comfort: [
      comfortFor(shoulders + shift.sh - weightScore * 0.012 + painShoulders),
      comfortFor(hips + shift.hip - weightScore * 0.012 + painHips - 0.1 * painBack),
      legsComfort
    ],
    support: [
      supportFor(shoulders - 0.08 + shift.supSh + weightScore * 0.025 + 0.06 * painBack),
      supportFor(hips + shift.supHip + weightScore * 0.025 + 0.12 * (painHips > 0) + 0.26 * painBack),
      legsSupport
    ]
  };
}

/** Lower is better: alignment error, distance from the starting point, and pain preferences. */
function candidateCost(sleeper, start, levels, measured) {
  const [c0, c1] = levels.comfort, [s0, s1] = levels.support;
  const C = COMFORT_LEVELS, S = SUPPORT_LEVELS;
  const fit = alignment(sleeper, zoneSinks(sleeper, levels), measured);
  const distance = Math.abs(C.indexOf(c0) - C.indexOf(start.comfort[0])) + Math.abs(C.indexOf(c1) - C.indexOf(start.comfort[1]))
                 + Math.abs(S.indexOf(s0) - S.indexOf(start.support[0])) + Math.abs(S.indexOf(s1) - S.indexOf(start.support[1]));
  const allowedError = hurts(sleeper, "neck") || hurts(sleeper, "back") ? 0.18 : 0.3;   // pain: keep the spine straighter
  let cost = Math.max(0, fit.error - allowedError) + distance * 0.12;
  if (hurts(sleeper, "shoulders")) cost += C.indexOf(c0) * 0.16;               // sore shoulders: softer comfort up top
  if (hurts(sleeper, "hips")) cost += C.indexOf(c1) * 0.1;                     // sore hips: more relief at the hips
  if (hurts(sleeper, "back")) cost += (S.length - 1 - S.indexOf(s1)) * 0.14;   // lower back: firm support under the hips
  return cost;
}

/**
 * Recommend one side of the bed for one sleeper.
 * @param sleeper  sleeper profile (see sleeper.js)
 * @param measured optional measured body widths and head gap, in meters
 * @returns { comfort: [3 feels], support: [3 feels], pillow } for shoulders, hips, legs
 */
export function recommend(sleeper, measured = null) {
  const start = recommendFromShape(sleeper);
  let best = start, bestCost = Infinity;
  for (const c0 of COMFORT_LEVELS) for (const c1 of COMFORT_LEVELS)
    for (const s0 of SUPPORT_LEVELS) for (const s1 of SUPPORT_LEVELS) {
      const levels = { comfort: [c0, c1, start.comfort[2]], support: [s0, s1, start.support[2]] };
      const cost = candidateCost(sleeper, start, levels, measured);
      if (cost < bestCost - 1e-9) { bestCost = cost; best = levels; }
    }
  return { ...best, pillow: bestPillow(sleeper, zoneSinks(sleeper, best), measured) };
}
