/**
 * Sleep Fit constants.
 * Values are copied unchanged from the existing TogetherBed site (index.html)
 * so that both versions recommend the same bed. Change them in one place only.
 */

/** Comfort cube feels, softest first. */
export const COMFORT_LEVELS = ["Plush", "Medium", "Firm"];

/** Coil support feels, softest first. */
export const SUPPORT_LEVELS = ["Medium", "Firm", "Extra Firm"];

/** The three zones of each side, head to foot. */
export const ZONES = ["Shoulders", "Hips", "Legs"];

/** Body settings used when a sleeper skips a question. */
export const KIND_DEFAULTS = {
  female:  { sh: 0.42, hip: 0.62, curve: 0.6,  bust: 0.5, legs: 0.5,  height: 64, weight: 150 },
  male:    { sh: 0.66, hip: 0.4,  curve: 0.35, bust: 0.5, legs: 0.55, height: 70, weight: 185 },
  neutral: { sh: 0.52, hip: 0.5,  curve: 0.48, bust: 0.5, legs: 0.52, height: 67, weight: 165 }
};

/** How much each comfort cube gives under load (1 = most). */
export const COMFORT_GIVE = { Plush: 1, Medium: 0.65, Firm: 0.35 };

/** How much each coil block gives under load (1 = most). */
export const SUPPORT_GIVE = { Medium: 1, Firm: 0.7, "Extra Firm": 0.45 };

/** Load multiplier per zone for each sleep position. Side sleeping concentrates the load. */
export const POSE_LOAD = {
  back:    [1, 1, 1],
  side:    [1.5, 1.6, 1.1],
  stomach: [1, 1.15, 1]
};

/** Spine alignment ratings, best first. `max` is the upper error bound for the rating. */
export const ALIGN_LEVELS = [
  { max: 0.6,      label: "Aligned" },
  { max: 1.1,      label: "Slightly out of line" },
  { max: 1.7,      label: "Out of line" },
  { max: Infinity, label: "Poor alignment" }
];

/** Pillow heights in inches. */
export const PILLOW_INCHES = { Thin: 3, Medium: 5, Thick: 7 };

/** Extra pillow height each position needs (meters). */
export const PILLOW_BIAS = { back: 0.1, side: 0.03, stomach: 0.075 };

/** How much of the measured head-to-mattress gap counts in each position. */
export const PILLOW_GAP_WEIGHT = { back: 0.5, side: 1, stomach: 1 };

/** Head-to-mattress gap (meters) used when the body has not been measured. */
export const DEFAULT_HEAD_GAP = { back: 0.03, side: 0.12, stomach: 0.03 };

/** Shoulder and hip half-widths (meters) used when the body has not been measured. */
export const DEFAULT_BODY_WIDTHS = { sh: 0.2, hip: 0.18 };
