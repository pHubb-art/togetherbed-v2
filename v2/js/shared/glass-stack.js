/**
 * Glass cards: the site's background element. Loose, slightly offset squircles
 * of colored glass that deepen where they overlap, and slide into one when blended.
 * They sit behind the real content (the bed, the questions) to add color and
 * life. They are never the main subject, and screen readers skip them.
 * Looks come from ".glass-stack" in css/components.css.
 */
import { MATERIALS, FEELS, mixPanes } from "../fit/build-color.js";

const SIZE = 200;        // drawing box
const PANE = 118;        // pane width and height inside the box
const GROOVE = "#4A2418"; // etched marks are a darker groove, never white

/**
 * Where each pane rests, in order of arrival: offset from center and a slight turn.
 * Same deal as the design system's card stack, scaled to this drawing box.
 */
const RESTING = [
  { x: -21, y: 16,  turn: -7 },
  { x: 19,  y: -11, turn: 6 },
  { x: -9,  y: -21, turn: -3 },
  { x: 22,  y: 19,  turn: 8 }
];

/** One etched symbol per material, drawn in a 20 box (from the design system). */
const SYMBOLS = {
  latex: '<circle cx="6" cy="7" r="1.9" fill="#4A2418" fill-opacity="0.3" stroke="none"/><circle cx="14" cy="7" r="1.9" fill="#4A2418" fill-opacity="0.3" stroke="none"/><circle cx="10" cy="14" r="1.9" fill="#4A2418" fill-opacity="0.3" stroke="none"/>',
  coil: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3"/>',
  memory: '<path d="M3 6q7 13 14 0"/>',
  hybrid: '<circle cx="7" cy="10" r="5"/><circle cx="13" cy="10" r="5"/>'
};

/** A squircle path (superellipse corners) centered on 0,0. */
function squirclePath(width, height = width, cornerShare = 0.2) {
  const halfW = width / 2, halfH = height / 2, r = Math.min(width, height) * cornerShare, steps = 10;
  const corners = [[halfW - r, -halfH + r, -90], [halfW - r, halfH - r, 0], [-halfW + r, halfH - r, 90], [-halfW + r, -halfH + r, 180]];
  let path = "";
  corners.forEach(([cx, cy, startDegrees], corner) => {
    for (let step = 0; step <= steps; step++) {
      const angle = (startDegrees + 90 * step / steps) * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
      const x = cx + r * Math.sign(cos) * Math.sqrt(Math.abs(cos)), y = cy + r * Math.sign(sin) * Math.sqrt(Math.abs(sin));
      path += `${corner === 0 && step === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });
  return path + "Z";
}

const SHAPE = squirclePath(PANE);

function paneSvg(pane, index, isNew) {
  const rest = RESTING[index % RESTING.length];
  const color = MATERIALS[pane.material].color, opacity = FEELS[pane.feel].opacity;
  const corner = -PANE / 2 + 12;
  return `
    <g class="pane${isNew ? " is-new" : ""}" style="--x:${rest.x}px; --y:${rest.y}px; --turn:${rest.turn}deg">
      <path d="${SHAPE}" fill="#B9562A" fill-opacity="0.07" filter="url(#pane-thickness)" transform="translate(0 4)"/>
      <path d="${SHAPE}" fill="${color}" fill-opacity="${opacity}"/>
      <g class="pane-mark" transform="translate(${corner} ${corner}) scale(0.8)" fill="none" stroke="${GROOVE}" stroke-opacity="0.3" stroke-width="1.7" stroke-linecap="round">${SYMBOLS[pane.material] || ""}</g>
    </g>`;
}

/**
 * @param host     the element that holds the drawing (give it the class "glass-stack")
 * @param panes    [{ material, feel }, ...] bottom to top
 * @param blended  true once the build is finished: the panes slide into one
 */
export function drawGlassStack(host, panes, { blended = false } = {}) {
  const before = Number(host.dataset.count || 0);
  host.dataset.count = panes.length;
  host.innerHTML = `
    <svg viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false">
      <defs><filter id="pane-thickness" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs>
      <g class="panes" transform="translate(${SIZE / 2} ${SIZE / 2})">${panes.map((pane, index) => paneSvg(pane, index, index >= before)).join("")}</g>
    </svg>`;
  host.style.setProperty("--blend-color", panes.length ? mixPanes(panes) : "transparent");
  host.classList.remove("is-blended");
  if (blended) requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add("is-blended")));
}

/* ---------- The bed, zone by zone ---------- */

const BED = { width: 220, height: 258, blockWidth: 92, blockHeight: 66, rows: [50, 129, 208] };
const BLOCK = squirclePath(BED.blockWidth, BED.blockHeight, 0.24);
const BED_BASE = squirclePath(BED.width - 8, BED.height - 8, 0.1);
/** Where the two panes of a zone rest before they square up. */
const BLOCK_RESTING = [{ x: -5, y: 4, turn: -3 }, { x: 5, y: -4, turn: 2.5 }];
const seenBefore = new Map();   // drawing id -> pane keys already on screen, so only new panes drop in

function blockPaneSvg(pane, layer, isNew) {
  const rest = BLOCK_RESTING[layer % BLOCK_RESTING.length];
  const color = MATERIALS[pane.material].color, opacity = FEELS[pane.feel].opacity;
  return `
      <g class="pane${isNew ? " is-new" : ""}" style="--x:${rest.x}px; --y:${rest.y}px; --turn:${rest.turn}deg">
        <path d="${BLOCK}" fill="#B9562A" fill-opacity="0.07" filter="url(#bed-thickness)" transform="translate(0 3)"/>
        <path d="${BLOCK}" fill="${color}" fill-opacity="${opacity}"/>
        <g class="pane-mark" transform="translate(${-BED.blockWidth / 2 + 8} ${-BED.blockHeight / 2 + 8}) scale(0.5)" fill="none" stroke="${GROOVE}" stroke-opacity="0.3" stroke-width="1.7" stroke-linecap="round">${SYMBOLS[pane.material] || ""}</g>
      </g>`;
}

/**
 * Draws the bed from above: one or two sides, three zones each, every zone a
 * small pile of glass panes. New panes drop in; when blended, each zone
 * squares up into its own color.
 * @param host   the element that holds the drawing (class "glass-stack", with an id)
 * @param sides  [ side: [ zone: [{ material, feel }, ...] ] ], zones head to foot
 */
export function drawGlassBed(host, sides, { blended = false } = {}) {
  const seen = seenBefore.get(host.id) || new Set(), now = new Set();
  const columns = sides.length === 1 ? [BED.width / 2] : [BED.width / 2 - 52, BED.width / 2 + 52];
  const blocks = sides.map((zones, side) => zones.map((panes, zone) => `
    <g class="panes" transform="translate(${columns[side]} ${BED.rows[zone]})">${panes.map((pane, layer) => {
      const key = `${side}-${zone}-${layer}`;
      now.add(key);
      return blockPaneSvg(pane, layer, !seen.has(key));
    }).join("")}</g>`).join("")).join("");
  seenBefore.set(host.id, now);

  host.innerHTML = `
    <svg viewBox="0 0 ${BED.width} ${BED.height}" aria-hidden="true" focusable="false">
      <defs><filter id="bed-thickness" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs>
      <path class="bed-base" d="${BED_BASE}" transform="translate(${BED.width / 2} ${BED.height / 2})"/>
      ${blocks}
    </svg>`;
  host.classList.remove("is-blended");
  if (blended) requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add("is-blended")));
}
