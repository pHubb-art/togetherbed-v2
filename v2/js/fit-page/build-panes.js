/**
 * Which glass panes sit behind Sleep Fit at each moment.
 * Every answer lays one more pane down: the sleep position brings that
 * sleeper's support pane, the build brings their comfort pane.
 *
 * Sleep Fit does not ask about materials, so until the builder does, each
 * sleeper's comfort pane uses their own color: apricot for sleeper one,
 * rose for sleeper two.
 */
import { COMFORT_LEVELS, SUPPORT_LEVELS } from "../fit/constants.js";
import { typicalLevel } from "../fit/bed-lines.js";
import { FEEL_BY_NAME, FEELS, MATERIALS, mixPanes, buildCode } from "../fit/build-color.js";

const COMFORT_MATERIAL = ["memory", "hybrid"];

/** The two panes for one finished side: support underneath, comfort on top. */
export function panesForSide(side, sideIndex) {
  return [
    { material: "coil", feel: FEEL_BY_NAME[typicalLevel(side.support, SUPPORT_LEVELS)], sleeper: sideIndex },
    { material: COMFORT_MATERIAL[sideIndex], feel: FEEL_BY_NAME[typicalLevel(side.comfort, COMFORT_LEVELS)], sleeper: sideIndex }
  ];
}

/** How many of a sleeper's two panes their answers have earned so far. */
function panesEarned(flow, sideIndex) {
  if (flow.skipped || ["result", "tune"].includes(flow.screen)) return 2;
  const answers = flow.answers[sideIndex];
  return (answers.pose ? 1 : 0) + (answers.build ? 1 : 0);
}

/** The finished build's color and number. One number per side, since each side is its own build. */
export function buildColor(flow, bed) {
  const sides = flow.solo ? [0] : [0, 1];
  const panes = sides.flatMap(sideIndex => panesForSide(bed.sides[sideIndex], sideIndex));
  return { hex: mixPanes(panes), number: sides.map(sideIndex => buildCode(panesForSide(bed.sides[sideIndex], sideIndex))).join(" / "), panes };
}

/* ---------- Zone by zone: the color art that builds under the questions ---------- */

/** The two panes of one zone on one side: support underneath, comfort on top. */
function panesForZone(side, sideIndex, zone) {
  return [
    { material: "coil", feel: FEEL_BY_NAME[side.support[zone]] },
    { material: COMFORT_MATERIAL[sideIndex], feel: FEEL_BY_NAME[side.comfort[zone]] }
  ];
}

/**
 * The color art as it stands now: one pair per zone, each shape colored by the
 * answers given so far (null until that sleeper has answered anything).
 * @returns [{ left, right }] head to foot; "right" is left out for a sleeper on their own
 */
export function pairsSoFar(flow, bed) {
  const colorFor = (sideIndex, zone) => {
    const earned = panesEarned(flow, sideIndex);
    return earned ? mixPanes(panesForZone(bed.sides[sideIndex], sideIndex, zone).slice(0, earned)) : null;
  };
  return [0, 1, 2].map(zone => flow.solo ? { left: colorFor(0, zone) } : { left: colorFor(0, zone), right: colorFor(1, zone) });
}

/**
 * The same art as glass panels: one stack per sleeper per zone, one panel per layer.
 * Every sleeper starts on the same generic bed (medium everywhere), so the stacks begin
 * alike. Answers then change how firm each layer is, zone by zone: firmer panels are
 * fuller in color, so the hips usually deepen and the shoulders lighten.
 * @returns [{ left: [card], right: [card] }] head to foot, ready for zonePairsHtml
 */
export function stacksSoFar(flow, bed) {
  const generic = sideIndex => [{ material: "coil", feel: "medium" }, { material: COMFORT_MATERIAL[sideIndex], feel: "medium" }];
  const cardsFor = (sideIndex, zone) =>
    (panesEarned(flow, sideIndex) ? panesForZone(bed.sides[sideIndex], sideIndex, zone) : generic(sideIndex))
      .map(pane => ({ color: MATERIALS[pane.material].color, opacity: FEELS[pane.feel]?.opacity ?? 0.7 }));
  return [0, 1, 2].map(zone => flow.solo ? { left: cardsFor(0, zone) } : { left: cardsFor(0, zone), right: cardsFor(1, zone) });
}

/** The color each finished zone blends into, shoulders to legs. */
export function zoneColors(side, sideIndex) {
  return [0, 1, 2].map(zone => mixPanes(panesForZone(side, sideIndex, zone)));
}
