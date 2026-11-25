/**
 * Pressure model: how far each zone of the body sinks into the bed.
 * Softer comfort cubes and softer coils compress more under the same load.
 */
import { COMFORT_GIVE, SUPPORT_GIVE, POSE_LOAD } from "./constants.js";
import { weightPounds } from "./sleeper.js";

const MAX_COMFORT_SINK = 0.075;   // meters
const MAX_SUPPORT_SINK = 0.09;    // meters

/** Share of body weight carried by shoulders, hips and legs. */
function weightShares(sleeper) {
  return [
    0.33 + (sleeper.sh - 0.5) * 0.06,
    0.47 + (sleeper.hip - 0.5) * 0.06 + (sleeper.curve - 0.5) * 0.04,
    0.2
  ];
}

/**
 * @param sleeper sleeper profile
 * @param levels  { comfort: [3 feels], support: [3 feels] } for shoulders, hips, legs
 * @returns sink depth in meters per zone: { comfort, support, total }
 */
export function zoneSinks(sleeper, levels) {
  const weight = weightPounds(sleeper);
  const shares = weightShares(sleeper);
  const poseLoad = POSE_LOAD[sleeper.pose] || POSE_LOAD.back;
  const comfort = [], support = [], total = [];
  for (let zone = 0; zone < 3; zone++) {
    const load = weight * shares[zone] * poseLoad[zone] / 100;
    comfort[zone] = Math.min(MAX_COMFORT_SINK, load * 0.035 * COMFORT_GIVE[levels.comfort[zone]]);
    support[zone] = Math.min(MAX_SUPPORT_SINK, load * 0.03 * SUPPORT_GIVE[levels.support[zone]]);
    total[zone] = comfort[zone] + support[zone];
  }
  return { comfort, support, total };
}
