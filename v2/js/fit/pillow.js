/**
 * Pillow fit: the right pillow fills the gap between head and mattress
 * so the neck carries on the line of the spine.
 */
import { PILLOW_INCHES, PILLOW_BIAS, PILLOW_GAP_WEIGHT, DEFAULT_HEAD_GAP } from "./constants.js";

const METERS_PER_INCH = 0.0254;
const COMPRESSED_SHARE = 0.8;   // a pillow keeps about 80% of its height under the head

/** Height of a pillow under the head's weight, in meters. */
export function pillowHeight(name) {
  return PILLOW_INCHES[name] * METERS_PER_INCH * COMPRESSED_SHARE;
}

/** The pillow height (meters) that would keep this sleeper's neck straight. */
export function idealPillowHeight(sleeper, sinks, measured) {
  const gap = measured && measured.gap ? measured.gap[sleeper.pose] : DEFAULT_HEAD_GAP[sleeper.pose];
  const gapWeight = PILLOW_GAP_WEIGHT[sleeper.pose] || 1;
  const bias = PILLOW_BIAS[sleeper.pose] || 0;
  // The pillow sits on the shoulder cube, which gives a little under the head.
  return gap * gapWeight + bias - sinks.total[0] + 0.35 * sinks.comfort[0];
}

/** Name of the pillow closest to the ideal height. */
export function bestPillow(sleeper, sinks, measured) {
  const ideal = idealPillowHeight(sleeper, sinks, measured);
  return Object.keys(PILLOW_INCHES).reduce((best, name) =>
    Math.abs(pillowHeight(name) - ideal) < Math.abs(pillowHeight(best) - ideal) ? name : best);
}
