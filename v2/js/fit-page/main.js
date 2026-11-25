/**
 * Sleep Fit page: wires the flow, the engine and the screens together.
 */
import { loadJson } from "../shared/load-json.js";
import { saveState, readState, clearState } from "../shared/storage.js";
import { newFlow, nextScreen, previousScreen, withAnswer, skipToResult, continueSolo, progress, QUESTION_ORDER } from "./flow.js";
import { buildBed } from "./build-bed.js";
import { introView, questionView, partnerView, resultView } from "./views.js";

const app = document.getElementById("fit-app");
const bar = document.getElementById("fit-progress");
let copy, bedData, flow;

function render({ moveFocus = true } = {}) {
  if (flow.screen === "intro") app.innerHTML = introView(copy);
  else if (flow.screen === "partner") app.innerHTML = partnerView(copy);
  else if (flow.screen === "result") app.innerHTML = resultView(copy, buildBed(flow, bedData), bedData);
  else app.innerHTML = questionView(copy, flow);

  app.dataset.screen = flow.screen;
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
  restart: () => { clearState("fit-flow"); go(newFlow()); }
};

app.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action && ACTIONS[action]) ACTIONS[action]();
});

app.addEventListener("change", event => {
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
