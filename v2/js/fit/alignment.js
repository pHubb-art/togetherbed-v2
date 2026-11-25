/**
 * Spine alignment: how straight the spine sits for a given set of sink depths.
 * Side sleepers: the wider of shoulders and hips must sink further.
 * Back and stomach sleepers: hips should sit level, not sag into a hammock.
 */
import { ALIGN_LEVELS, PILLOW_INCHES, DEFAULT_BODY_WIDTHS } from "./constants.js";
import { pillowHeight, idealPillowHeight } from "./pillow.js";

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function sideSleeperError(sinks, measured, depth) {
  const widths = measured || DEFAULT_BODY_WIDTHS;
  const need = clamp((widths.sh - widths.hip) * 0.35, -0.03, 0.03);   // the shoulder rolls slightly forward
  const tilt = (need - sinks.total[0]) - (0 - sinks.total[1]);       // spine height at shoulders minus at hips
  const hint = tilt > 0
    ? "Shoulders sit too high. Try a softer shoulder zone or firmer hips."
    : "Hips sit too high. Try softer hips or a firmer shoulder zone.";
  return { error: Math.abs(tilt) / (0.025 * depth), tilt, sag: 0, hint };
}

function flatSleeperError(sleeper, sinks, depth) {
  const t = sinks.total;
  const onBack = sleeper.pose === "back";
  const target = onBack ? 0.004 + (sleeper.curve - 0.5) * 0.006 : -0.002;
  const tilt = t[1] - t[0];
  const sag = t[1] - (t[0] + t[2]) / 2 - target;
  const tolerance = (onBack ? 0.014 : 0.011) * depth;
  const error = Math.max(Math.abs(sag) / tolerance, Math.abs(tilt - target) / (tolerance * 1.6));
  let hint = "Hips sit too high. Try softer hip comfort or firmer shoulders.";
  if (sag > 0) {
    hint = sleeper.pose === "stomach"
      ? "Hips sink too deep, arching the lower back. Try firmer hip support."
      : "Hips sink too deep. Try firmer hip support.";
  }
  return { error, tilt, sag, hint };
}

/** Neck error for a chosen pillow, with a hint naming the next size to try. */
function neckError(sleeper, sinks, measured, pillow) {
  const low = pillowHeight("Thin") - 0.012, high = pillowHeight("Thick") + 0.012;   // beyond the range, the nearest size is the best there is
  const neck = pillowHeight(pillow) - clamp(idealPillowHeight(sleeper, sinks, measured), low, high);
  const sizes = Object.keys(PILLOW_INCHES), index = sizes.indexOf(pillow);
  const name = pillow.toLowerCase();
  const hint = neck > 0
    ? `The ${name} pillow is too high, tipping the head ${sleeper.pose === "side" ? "up" : "forward"}. Try ${sizes[Math.max(0, index - 1)].toLowerCase()}.`
    : `The ${name} pillow is too low, letting the head drop. Try ${sizes[Math.min(2, index + 1)].toLowerCase()}.`;
  return { neck, error: Math.abs(neck) / 0.04, hint };
}

/**
 * @param sleeper  sleeper profile
 * @param sinks    result of zoneSinks()
 * @param measured optional measured body: { sh, hip, gap: { back, side, stomach } } in meters
 * @param pillow   optional pillow name; when given, the neck is rated too
 * @returns { error, tilt, sag, neck, label, rank, hint } where rank 0 is best
 */
export function alignment(sleeper, sinks, measured, pillow) {
  const t = sinks.total;
  const depth = Math.max(1, Math.sqrt((t[0] + t[1] + t[2]) / 3 / 0.035));   // bigger builds: judged on the angle, not millimetres
  let { error, tilt, sag, hint } = sleeper.pose === "side"
    ? sideSleeperError(sinks, measured, depth)
    : flatSleeperError(sleeper, sinks, depth);

  let neck = 0;
  if (pillow) {
    const result = neckError(sleeper, sinks, measured, pillow);
    neck = result.neck;
    if (result.error > error) { error = result.error; hint = result.hint; }
  }

  const rank = ALIGN_LEVELS.findIndex(level => error < level.max);
  if (rank === 0) hint = "Head, neck, shoulders and hips line up.";
  return { error, tilt, sag, neck, label: ALIGN_LEVELS[rank].label, rank, hint };
}
