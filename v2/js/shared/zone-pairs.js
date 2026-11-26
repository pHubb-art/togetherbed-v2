/**
 * Zone stacks: the site's color art, built from plain HTML and CSS shapes.
 * Each zone of the bed (shoulders, hips, legs) gets one stack per sleeper: the left
 * stack is sleeper one's, the right is sleeper two's, and they overlap in the middle.
 * A stack is one near-square glass panel per layer of the bed, piled slightly off-centre
 * like photos on a table. Slivers of each layer show at the edges; the middle,
 * where every card overlaps, is that zone's color.
 * Decoration only: screen readers skip it, and the same facts are given in words.
 * Looks come from ".zone-pairs" in css/components.css.
 */
const shownBefore = new Map();   // drawing name -> what each card looked like last time, so only changed ones move

/** How far each card in a stack sits off-centre: [across %, down %, turn in degrees]. Card one is the bottom layer. */
const OFFSETS = [[-3, 2.5, -1.2], [3.5, -2, 1.4], [-1.5, -3.5, -0.8], [2.5, 3, 1.8], [-4, -1, 0.9]];

/** A stack can be given as one color, as a list of cards, or as nothing yet. */
const cardsOf = stack => !stack ? [] : typeof stack === "string" ? [{ color: stack }] : stack;

function cardHtml(card, place, mirrored, isNew) {
  const [x, y, turn] = OFFSETS[place % OFFSETS.length];
  const flip = mirrored ? -1 : 1;   // the right-hand stack leans the other way, so the pair looks hand-laid
  // The outer element places and lifts the panel; the inner one is the glass itself.
  return `<i class="${isNew ? "is-new" : ""}" style="--c:${card.color};--o:${card.opacity ?? 1};--x:${x * flip}%;--y:${y}%;--r:${turn * flip}deg"><b class="sq"></b></i>`;
}

/**
 * @param name   a name for this drawing, so it remembers what was already on screen
 * @param zones  [{ left, right }] head to foot. Each side is a list of cards, bottom layer first:
 *               [{ color: "#F1E4EA", opacity: 0.9 }, ...]. An empty list or null means "not chosen yet".
 *               Leave "right" out entirely for a sleeper on their own.
 * A card that changed since the last drawing is dropped again in a new spot, like a deck being shuffled.
 */
export function zonePairsHtml(name, zones) {
  const before = shownBefore.get(name) || new Map(), now = new Map();
  const rows = zones.map((zone, zoneIndex) => {
    const sides = "right" in zone ? ["left", "right"] : ["left"];
    const stacks = sides.map(side => {
      const cards = cardsOf(zone[side]).map((card, cardIndex) => {
        const key = `${zoneIndex}-${side}-${cardIndex}`, look = `${card.color} ${card.opacity}`;
        const last = before.get(key);
        const changed = !last || last.look !== look;
        const moves = last ? last.moves + (changed ? 1 : 0) : 0;
        now.set(key, { look, moves });
        return cardHtml(card, cardIndex + zoneIndex + moves, side === "right", changed);
      }).join("");
      return `<span class="zone-stack${cards ? "" : " is-empty"}">${cards || '<i><b class="sq"></b></i>'}</span>`;
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
