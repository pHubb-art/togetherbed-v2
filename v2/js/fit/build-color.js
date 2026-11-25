/**
 * Build color: every material has its own color, every feel its own strength.
 * Stacked like panes of glass, the layers of a bed mix into one color that
 * belongs to that build, with a number that reads like a paint chip.
 *
 * Values are copied from the design system (design-system/color-glass.js) and
 * checked against it in the tests. Change them there first, then here.
 */

/** Material colors, with the digit each one adds to the build number. */
export const MATERIALS = {
  coil:      { color: "#F1E4EA", name: "Pearl",   digit: 1 },
  latexcore: { color: "#F2C14E", name: "Honey",   digit: 2 },
  latex:     { color: "#F7D774", name: "Butter",  digit: 3 },
  memory:    { color: "#F7A980", name: "Apricot", digit: 4 },
  hybrid:    { color: "#F09BB8", name: "Rose",    digit: 5 },
  fiber:     { color: "#E3A6D6", name: "Orchid",  digit: 6 }
};

/** How see-through a pane is: firmer means fuller color. The digit runs from 1 (firmest) to 4. */
export const FEELS = {
  xfirm:  { opacity: 0.95, digit: 1 },
  firm:   { opacity: 0.9,  digit: 2 },
  medium: { opacity: 0.75, digit: 3 },
  plush:  { opacity: 0.57, digit: 4 }
};

/** Sleep Fit feel names and the feel ids used here. */
export const FEEL_BY_NAME = { Plush: "plush", Medium: "medium", Firm: "firm", "Extra Firm": "xfirm" };

const channels = hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
const toHex = rgb => "#" + rgb.map(value => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase();

/** The color one pane shows over white. */
function paneOverWhite(pane) {
  const opacity = FEELS[pane.feel]?.opacity ?? 0.7;
  return channels(MATERIALS[pane.material].color).map(value => 255 - (255 - value) * opacity);
}

/**
 * The single color a stack of panes blends into (each pane multiplies the ones below).
 * @param panes [{ material, feel }, ...] bottom to top
 */
export function mixPanes(panes) {
  let color = [255, 255, 255];
  for (const pane of panes) color = color.map((value, index) => value * paneOverWhite(pane)[index] / 255);
  return toHex(color);
}

/** Two digits for one pane: material, then feel. "42" is firm memory foam. */
export function paneCode(pane) {
  return `${MATERIALS[pane.material].digit}${FEELS[pane.feel]?.digit ?? 3}`;
}

/** The build number: pane codes bottom to top, joined by middle dots. */
export function buildCode(panes) {
  return panes.map(paneCode).join("·");
}
