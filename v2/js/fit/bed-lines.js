/**
 * Bed lines and pre-builds.
 * A recommendation is per zone. A pre-build has one comfort feel and one
 * support feel for a whole side. These helpers connect the two and decide
 * which product line a bed belongs to.
 *
 * Line 1: one feel per side (a pre-build). Ordered online.
 * Line 2: comfort differs by zone, support is the same along the side. Built in store.
 * Line 3: support differs by zone too. Built in store.
 */
import { COMFORT_LEVELS, SUPPORT_LEVELS } from "./constants.js";

const allSame = values => values.every(value => value === values[0]);

/** Product line (1, 2 or 3) for one side of the bed. */
export function lineForSide(side) {
  if (!allSame(side.support)) return 3;
  return allSame(side.comfort) ? 1 : 2;
}

/** A bed needs the highest line that either of its sides needs. */
export function lineForBed(sides) {
  return Math.max(...sides.map(lineForSide));
}

/** Middle value of a list of feels, on that feel's soft-to-firm scale. */
function typicalLevel(values, scale) {
  const ranks = values.map(value => scale.indexOf(value)).sort((a, b) => a - b);
  return scale[ranks[Math.floor(ranks.length / 2)]];
}

/** Pre-builds store ids ("plush", "XF"); the engine uses names ("Plush", "Extra Firm"). */
const COMFORT_BY_ID = { plush: "Plush", medium: "Medium", firm: "Firm" };
const SUPPORT_BY_ID = { M: "Medium", F: "Firm", XF: "Extra Firm" };

/**
 * Closest pre-build to a per-zone recommendation, for the order-online path.
 * @param side      { comfort: [3 feels], support: [3 feels] }
 * @param prebuilds list from data/beds.json: [{ id, contour, support, ... }]
 */
export function closestPrebuild(side, prebuilds) {
  const comfort = COMFORT_LEVELS.indexOf(typicalLevel(side.comfort, COMFORT_LEVELS));
  const support = SUPPORT_LEVELS.indexOf(typicalLevel(side.support, SUPPORT_LEVELS));
  let best = null, bestDistance = Infinity;
  for (const prebuild of prebuilds) {
    const distance = Math.abs(COMFORT_LEVELS.indexOf(COMFORT_BY_ID[prebuild.contour]) - comfort)
                   + Math.abs(SUPPORT_LEVELS.indexOf(SUPPORT_BY_ID[prebuild.support]) - support);
    if (distance < bestDistance) { best = prebuild; bestDistance = distance; }
  }
  return best;
}
