/**
 * Where every part of the bed sits in each chapter of the homepage story.
 * Pure data and math, with no 3D code, so it can be tested on its own.
 *
 * Offsets are [x, y, z] in meters from a part's resting place.
 * Left side (x < 0) is sleeper one, right side is sleeper two.
 * Zones run head to foot: shoulders, hips, legs.
 */
export const COILS = ["c1", "c2", "c3", "c4", "c5", "c6"];
export const CUBES = ["b1", "b2", "b3", "b4", "b5", "b6"];
export const PARTS = ["base", ...COILS, ...CUBES, "mid", "relief", "cover"];

/** Which comfort cubes belong to each sleeper, by zone. */
export const CUBES_BY_SIDE = { left: ["b6", "b4", "b2"], right: ["b5", "b3", "b1"] };

const OUT_OF_VIEW = [0, 2.6, 0];

function layout(groups) {
  const offsets = {};
  for (const [parts, offset] of groups) for (const part of parts) offsets[part] = offset;
  return offsets;
}

const closed = {};
const coverLifted = layout([[["cover"], [0, 0.22, 0]], [["relief"], [0, 0.08, 0]]]);
const exploded = layout([[COILS, [0, 0.36, 0]], [[...CUBES, "mid"], [0, 0.7, 0]], [["relief"], [0, 0.98, 0]], [["cover"], [0, 1.26, 0]]]);
const cubesShowing = layout([[["cover", "relief"], OUT_OF_VIEW]]);
const oneCubeOut = { ...cubesShowing, b3: [0, 0.34, 0] };

/**
 * One entry per chapter of data/copy.json "home.chapters", in the same order.
 * yaw: how far the bed is turned (radians). sideTint: 0 to 1, how strongly each side shows its sleeper color.
 */
export const CHAPTERS = [
  { id: "meet",    offsets: closed,       yaw: -0.5,  sideTint: 0 },
  { id: "problem", offsets: closed,       yaw: -0.15, sideTint: 0 },
  { id: "suit",    offsets: coverLifted,  yaw: 0.2,   sideTint: 0 },
  { id: "opens",   offsets: exploded,     yaw: 0.55,  sideTint: 0 },
  { id: "zones",   offsets: cubesShowing, yaw: 0.25,  sideTint: 0 },
  { id: "partner", offsets: cubesShowing, yaw: -0.25, sideTint: 1 },
  { id: "swap",    offsets: oneCubeOut,   yaw: -0.45, sideTint: 1 },
  { id: "fit",     offsets: closed,       yaw: -0.5,  sideTint: 0 }
];

const smooth = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const ZERO = [0, 0, 0];

/**
 * The bed's pose for a scroll position.
 * @param progress 0 at the first chapter, CHAPTERS.length - 1 at the last. Fractions blend two chapters.
 * @returns { offsets: { part: [x, y, z] }, yaw, sideTint }
 */
export function poseAt(progress) {
  const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, progress));
  const index = Math.min(CHAPTERS.length - 2, Math.floor(clamped));
  const from = CHAPTERS[index], to = CHAPTERS[index + 1];
  const t = smooth(clamped - index);
  const offsets = {};
  for (const part of PARTS) {
    const a = from.offsets[part] || ZERO, b = to.offsets[part] || ZERO;
    offsets[part] = [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  }
  return { offsets, yaw: mix(from.yaw, to.yaw, t), sideTint: mix(from.sideTint, to.sideTint, t) };
}
