/**
 * Sleep Fit flow: which screen comes next.
 * Pure logic with no page code, so it can be tested on its own.
 *
 * Screens, in order:
 *   intro -> (pose, build, pain) for sleeper 1 -> partner -> (pose, build, pain) for sleeper 2 -> result
 * "Skip" on the intro and "Just me" on the partner screen jump ahead.
 */
export const QUESTION_ORDER = ["pose", "build", "pain"];

export function newFlow() {
  return { screen: "intro", sleeper: 0, answers: [emptyAnswers(), emptyAnswers()], solo: false, skipped: false };
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
  if (flow.screen === "pain") return flow.sleeper === 0 ? { ...flow, screen: "partner" } : { ...flow, screen: "result" };
  return flow;
}

/** The screen before the current one. */
export function previousScreen(flow) {
  const position = QUESTION_ORDER.indexOf(flow.screen);
  if (position > 0) return { ...flow, screen: QUESTION_ORDER[position - 1] };
  if (flow.screen === "pose") return flow.sleeper === 0 ? { ...flow, screen: "intro" } : { ...flow, screen: "partner", sleeper: 0 };
  if (flow.screen === "partner") return { ...flow, screen: "pain", sleeper: 0 };
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
  return { ...flow, screen: "result", solo: true };
}

/** How far through the questions the visitor is, from 0 to 1. */
export function progress(flow) {
  const perSleeper = QUESTION_ORDER.length;
  const position = QUESTION_ORDER.indexOf(flow.screen);
  if (flow.screen === "intro") return 0;
  if (flow.screen === "result") return 1;
  if (flow.screen === "partner") return 0.5;
  return (flow.sleeper * perSleeper + position + 1) / (perSleeper * 2 + 1);
}
