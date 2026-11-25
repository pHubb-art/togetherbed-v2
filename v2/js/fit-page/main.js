/**
 * Sleep Fit page: wires the flow, the engine and the screens together.
 */
import { loadJson } from "../shared/load-json.js";
import { saveState, readState, clearState } from "../shared/storage.js";
import { newFlow, nextScreen, previousScreen, withAnswer, skipToResult, continueSolo, progress, QUESTION_ORDER, startEngineer, openTuning, withZoneLevel, resetTuning, withBody } from "./flow.js";
import { buildBed } from "./build-bed.js";
import { panesSoFar, buildColor } from "./build-panes.js";
import { drawGlassStack } from "../shared/glass-stack.js";
import { introView, questionView, partnerView, resultView, tuneView } from "./views.js";

const app = document.getElementById("fit-app");
const bar = document.getElementById("fit-progress");
const stack = document.getElementById("fit-stack");
let copy, bedData, flow;

function render({ moveFocus = true } = {}) {
  const bed = buildBed(flow, bedData);
  const color = buildColor(flow, bed);
  const finished = flow.screen === "result";

  if (flow.screen === "intro") app.innerHTML = introView(copy);
  else if (flow.screen === "partner") app.innerHTML = partnerView(copy);
  else if (flow.screen === "tune") app.innerHTML = tuneView(copy, flow, bed, bedData);
  else if (finished) app.innerHTML = resultView(copy, bed, bedData, color);
  else app.innerHTML = questionView(copy, flow);

  // The panes pile up behind the questions, then blend into one color on the result.
  drawGlassStack(stack, flow.screen === "intro" ? [] : panesSoFar(flow, bed), { blended: finished });
  // One theme color for the whole page, driven by the build.
  document.documentElement.style.setProperty("--build-color", color.hex);

  app.dataset.screen = flow.screen;
  document.body.dataset.fitScreen = flow.screen;
  bar.value = progress(flow);
  saveState("fit-flow", flow);
  if (moveFocus) app.querySelector("h1")?.focus({ preventScroll: true });
}

function go(nextFlow) {
  flow = nextFlow;
  render();
  window.scrollTo({ top: 0 });
}

const ACTIONS = {
  next: () => go(nextScreen(flow)),
  back: () => go(previousScreen(flow)),
  skip: () => go(skipToResult(flow)),
  solo: () => go(continueSolo(flow)),
  engineer: () => go(startEngineer(flow)),
  tune: () => go(openTuning(flow)),
  reset: button => retune(resetTuning(flow, Number(button.dataset.side))),
  restart: () => { clearState("fit-flow"); go(newFlow()); }
};

app.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (button && ACTIONS[button.dataset.action]) ACTIONS[button.dataset.action](button);
});

/** Redraw the tuning screen after a change, keeping the keyboard on the control just used. */
function retune(nextFlow, usedControl) {
  flow = nextFlow;
  const scroll = window.scrollY;
  render({ moveFocus: false });
  window.scrollTo({ top: scroll });
  if (!usedControl) return;
  const value = usedControl.type === "radio" ? `[value="${CSS.escape(usedControl.value)}"]` : "";
  app.querySelector(`[name="${usedControl.name}"]${value}`)?.focus({ preventScroll: true });
}

/** A block was changed by hand: names look like "tune-0-comfort-1" (side, layer, zone). */
function onTuneChange(control) {
  const [kind, side, field, zone] = control.name.split("-");
  if (kind === "tune") {
    const current = buildBed(flow, bedData).sides[Number(side)];
    retune(withZoneLevel(flow, Number(side), field, Number(zone), control.value, current), control);
  } else if (kind === "body") {
    const read = name => Number(app.querySelector(`[name="body-${side}-${name}"]`).value) || null;
    retune(withBody(flow, Number(side), { height: read("height"), weight: read("weight") }), control);
  }
}

app.addEventListener("change", event => {
  if (flow.screen === "tune") return onTuneChange(event.target);
  if (event.target.name !== "answer" || !QUESTION_ORDER.includes(flow.screen)) return;
  const picked = [...app.querySelectorAll("input[name=answer]:checked")].map(input => input.value);
  flow = withAnswer(flow, flow.screen, flow.screen === "pain" ? picked : picked[0]);
  saveState("fit-flow", flow);
  app.querySelector("[data-action=next]").disabled = false;
});

async function start() {
  try {
    [copy, bedData] = await Promise.all([loadJson("data/copy.json"), loadJson("data/beds.json")]);
  } catch (error) {
    app.textContent = "Sleep Fit could not load. Please refresh the page.";
    return;
  }
  flow = readState("fit-flow", null) || newFlow();
  render({ moveFocus: false });
}

start();
