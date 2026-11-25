/**
 * Sleep Fit flow: which screen comes next.
 * Pure logic with no page code, so it can be tested on its own.
 *
 * Screens, in order:
 *   intro -> (pose, build, pain) for sleeper 1 -> partner -> (pose, build, pain) for sleeper 2 -> result
 * "Skip" on the intro and "Just me" on the partner screen jump ahead.
 *
 * The engineer path adds one more screen, "tune", where each zone can be
 * changed by hand. It is reached from the result, or straight after the
 * questions when the visitor chose "Fine-tune it" on the intro.
 */
export const QUESTION_ORDER = ["pose", "build", "pain"];

export function newFlow() {
  return {
    screen: "intro", sleeper: 0, answers: [emptyAnswers(), emptyAnswers()], solo: false, skipped: false,
    engineer: false,          // true when the visitor asked to fine-tune from the start
    body: [null, null],       // optional { height, weight } per sleeper, in inches and pounds
    tuned: [null, null]       // hand-picked { comfort: [3], support: [3] } per side, or null for the suggestion
  };
}

function emptyAnswers() {
  return { pose: null, build: null, pain: [] };
}

/** The screen after the current one. */
export function nextScreen(flow) {
  const position = QUESTION_ORDER.indexOf(flow.screen);
  if (flow.screen === "intro") return { ...flow, screen: "pose", sleeper: 0 };
  if (flow.screen === "partner") return { ...flow, screen: "pose", sleeper: 1 };
  if (position >= 0 && position < QUESTION_ORDER.length - 1) return { ...flow, screen: QUESTION_ORDER[position + 1] };
  if (flow.screen === "pain") return flow.sleeper === 0 ? { ...flow, screen: "partner" } : { ...flow, screen: lastScreen(flow) };
  if (flow.screen === "tune") return { ...flow, screen: "result" };
  return flow;
}

/** Where the questions lead: the tuning screen on the engineer path, otherwise the result. */
function lastScreen(flow) {
  return flow.engineer ? "tune" : "result";
}

/** The screen before the current one. */
export function previousScreen(flow) {
  const position = QUESTION_ORDER.indexOf(flow.screen);
  if (position > 0) return { ...flow, screen: QUESTION_ORDER[position - 1] };
  if (flow.screen === "pose") return flow.sleeper === 0 ? { ...flow, screen: "intro" } : { ...flow, screen: "partner", sleeper: 0 };
  if (flow.screen === "partner") return { ...flow, screen: "pain", sleeper: 0 };
  if (flow.screen === "tune") return { ...flow, screen: "result" };
  if (flow.screen === "result") {
    if (flow.skipped) return newFlow();
    return flow.solo ? { ...flow, screen: "partner", solo: false } : { ...flow, screen: "pain", sleeper: 1 };
  }
  return flow;
}

/** Record an answer for the sleeper currently on screen. */
export function withAnswer(flow, question, value) {
  const answers = flow.answers.map((entry, index) => index === flow.sleeper ? { ...entry, [question]: value } : entry);
  return { ...flow, answers };
}

/** Skip every question and go straight to a balanced starting bed. */
export function skipToResult(flow) {
  return { ...flow, screen: "result", skipped: true };
}

/** One sleeper only: the second side mirrors the first. */
export function continueSolo(flow) {
  return { ...flow, screen: lastScreen(flow), solo: true };
}

/** How far through the questions the visitor is, from 0 to 1. */
export function progress(flow) {
  const perSleeper = QUESTION_ORDER.length;
  const position = QUESTION_ORDER.indexOf(flow.screen);
  if (flow.screen === "intro") return 0;
  if (flow.screen === "result" || flow.screen === "tune") return 1;
  if (flow.screen === "partner") return 0.5;
  return (flow.sleeper * perSleeper + position + 1) / (perSleeper * 2 + 1);
}

/* ---------- Engineer path ---------- */

/** Start the questions on the engineer path: they end on the tuning screen. */
export function startEngineer(flow) {
  return nextScreen({ ...flow, engineer: true });
}

/** Open the tuning screen from the result. */
export function openTuning(flow) {
  return { ...flow, screen: "tune" };
}

const replaceAt = (list, index, value) => (list || [null, null]).map((entry, position) => position === index ? value : entry);

/**
 * Change one block by hand.
 * @param side     0 or 1
 * @param layer    "comfort" or "support"
 * @param zone     0 shoulders, 1 hips, 2 legs
 * @param current  the side's levels on screen now: { comfort: [3], support: [3] }
 */
export function withZoneLevel(flow, side, layer, zone, value, current) {
  const levels = { comfort: [...current.comfort], support: [...current.support] };
  levels[layer][zone] = value;
  return { ...flow, tuned: replaceAt(flow.tuned, side, levels) };
}

/** Go back to the suggested build for one side. */
export function resetTuning(flow, side) {
  return { ...flow, tuned: replaceAt(flow.tuned, side, null) };
}

/** Record height and weight for one sleeper. Either can be null when left empty. */
export function withBody(flow, side, body) {
  const known = body.height || body.weight ? { height: body.height || null, weight: body.weight || null } : null;
  return { ...flow, body: replaceAt(flow.body, side, known) };
}
