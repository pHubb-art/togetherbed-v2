/**
 * Which glass cards sit behind the bed in each chapter of the story.
 * The pile grows as the story does: Maya's own color first, then the layers
 * of the bed, then Sam's color, and at the end they blend into one.
 */
const CARDS = [
  { material: "memory", feel: "medium" },   // apricot: Maya
  { material: "coil",   feel: "firm" },     // pearl: the support underneath
  { material: "latex",  feel: "medium" },   // butter: a comfort layer
  { material: "hybrid", feel: "medium" }    // rose: Sam
];

/** How many cards are down in each chapter, and whether they have blended. */
const BY_CHAPTER = {
  meet:     { count: 1 },
  struggle: { count: 1 },
  suit:     { count: 2 },
  open:     { count: 2 },
  zones:    { count: 3 },
  partner:  { count: 4 },
  swap:     { count: 4 },
  start:    { count: 4, blended: true }
};

export function panesForChapter(chapterId) {
  const { count = 1, blended = false } = BY_CHAPTER[chapterId] || {};
  return { panes: CARDS.slice(0, count), blended };
}
