/**
 * Zone stacks: the site's color art, built from plain HTML and CSS shapes.
 * Each zone of the bed (shoulders, hips, legs) gets one stack per sleeper: the left
 * stack is sleeper one's, the right is sleeper two's, and they overlap in the middle.
 * A stack is one near-square card per layer of the bed, piled slightly off-centre
 * like photos on a table. Slivers of each layer show at the edges; the middle,
 * where every card overlaps, is that zone's color.
 * Decoration only: screen readers skip it, and the same facts are given in words.
 * Looks come from ".zone-pairs" in css/components.css.
 */
const shownBefore = new Map();   // drawing name -> cards already on screen, so only new ones slide in

/** How far each card in a stack sits off-centre: [across %, down %, turn in degrees]. Card one is the bottom layer. */
const OFFSETS = [[-3, 2.5, -1.2], [3.5, -2, 1.4], [-1.5, -3.5, -0.8], [2.5, 3, 1.8], [-4, -1, 0.9]];

/** A stack can be given as one color, as a list of cards, or as nothing yet. */
const cardsOf = stack => !stack ? [] : typeof stack === "string" ? [{ color: stack }] : stack;

function cardHtml(card, index, mirrored, isNew) {
  const [x, y, turn] = OFFSETS[index % OFFSETS.length];
  const flip = mirrored ? -1 : 1;   // the right-hand stack leans the other way, so the pair looks hand-laid
  return `<i class="sq${isNew ? " is-new" : ""}" style="--c:${card.color};--o:${card.opacity ?? 1};--x:${x * flip}%;--y:${y}%;--r:${turn * flip}deg"></i>`;
}

/**
 * @param name   a name for this drawing, so it remembers what was already on screen
 * @param zones  [{ left, right }] head to foot. Each side is a list of cards, bottom layer first:
 *               [{ color: "#F1E4EA", opacity: 0.9 }, ...]. An empty list or null means "not chosen yet".
 *               Leave "right" out entirely for a sleeper on their own.
 */
export function zonePairsHtml(name, zones) {
  const before = shownBefore.get(name) || new Set(), now = new Set();
  const rows = zones.map((zone, zoneIndex) => {
    const sides = "right" in zone ? ["left", "right"] : ["left"];
    const stacks = sides.map(side => {
      const cards = cardsOf(zone[side]).map((card, cardIndex) => {
        const key = `${zoneIndex}-${side}-${cardIndex}`;
        now.add(key);
        return cardHtml(card, cardIndex, side === "right", !before.has(key));
      }).join("");
      return `<span class="zone-stack${cards ? "" : " is-empty"}">${cards || '<i class="sq"></i>'}</span>`;
    }).join("");
    return `<div class="zone-pair${sides.length === 1 ? " is-solo" : ""}">${stacks}</div>`;
  }).join("");
  shownBefore.set(name, now);
  return `<div class="zone-pairs" aria-hidden="true">${rows}</div>`;
}

/** One small pair of plain colors, to sit beside a zone's name. */
export function pairMarkHtml(zone) {
  const solo = !("right" in zone);
  const dot = color => `<i class="sq"${color ? ` style="--c:${color}"` : ""}></i>`;
  return `<span class="pair-mark${solo ? " is-solo" : ""}" aria-hidden="true">${dot(zone.left)}${solo ? "" : dot(zone.right)}</span>`;
}
