/**
 * Sleep Fit screens. Each function returns the HTML for one screen.
 * All visible words come from data/copy.json; nothing is written here.
 */
import { COMFORT_LEVELS, SUPPORT_LEVELS } from "../fit/constants.js";

const escapeHtml = text => String(text ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const sleeperLabel = (copy, index) => copy.ui.sleepers[index];

export function introView(copy) {
  const { quick, engineer, skip } = copy.fit.paths;
  return `
    <h1 tabindex="-1">${escapeHtml(copy.fit.headline)}</h1>
    <p class="lede">${escapeHtml(copy.fit.intro)}</p>
    <div class="choices fit-paths">
      <button class="choice sq" type="button" data-action="next"><strong>${escapeHtml(quick.label)}</strong><span>${escapeHtml(quick.blurb)}</span></button>
      <button class="choice sq" type="button" data-action="engineer"><strong>${escapeHtml(engineer.label)}</strong><span>${escapeHtml(engineer.blurb)}</span></button>
      <button class="choice sq" type="button" data-action="skip"><strong>${escapeHtml(skip.label)}</strong><span>${escapeHtml(skip.blurb)}</span></button>
    </div>`;
}

export function questionView(copy, flow) {
  const question = copy.fit.questions[flow.screen];
  const chosen = flow.answers[flow.sleeper][flow.screen];
  const many = flow.screen === "pain";
  const options = Object.entries(question.options).map(([id, label]) => {
    const checked = many ? chosen.includes(id) : chosen === id;
    return `<label class="choice sq"><input type="${many ? "checkbox" : "radio"}" name="answer" value="${escapeHtml(id)}"${checked ? " checked" : ""}><strong>${escapeHtml(label)}</strong></label>`;
  }).join("");
  const canContinue = many || chosen;
  return `
    <p class="eyebrow fit-who" data-sleeper="${flow.sleeper}">${escapeHtml(sleeperLabel(copy, flow.sleeper))}</p>
    <fieldset class="fit-question">
      <legend><h1 tabindex="-1">${escapeHtml(question.prompt)}</h1></legend>
      <div class="choices">${options}</div>
    </fieldset>
    ${many ? `<p class="field-hint">${escapeHtml(question.none)}</p>` : ""}
    <div class="btn-row">
      <button class="btn btn-quiet sq" type="button" data-action="back">${escapeHtml(copy.ui.back)}</button>
      <button class="btn btn-accent sq" type="button" data-action="next"${canContinue ? "" : " disabled"}>${escapeHtml(copy.ui.next)}</button>
    </div>`;
}

export function partnerView(copy) {
  const pass = copy.fit.passThePhone;
  return `
    <p class="eyebrow fit-who" data-sleeper="1">${escapeHtml(sleeperLabel(copy, 1))}</p>
    <h1 tabindex="-1">${escapeHtml(pass.headline)}</h1>
    <p class="lede">${escapeHtml(pass.body)}</p>
    <div class="btn-row">
      <button class="btn btn-accent sq" type="button" data-action="next">${escapeHtml(pass.cta)}</button>
      <button class="btn btn-quiet sq" type="button" data-action="solo">${escapeHtml(copy.ui.justMe)}</button>
      <button class="btn btn-quiet sq" type="button" data-action="back">${escapeHtml(copy.ui.back)}</button>
    </div>`;
}

function bedBlock(copy, side, sideIndex, zone, zoneIndex) {
  const feel = side.comfort[zoneIndex];
  return `
    <div class="bed-block sq" data-side="${sideIndex === 0 ? "left" : "right"}">
      <span class="shape shape-${feel.toLowerCase()}" aria-hidden="true"></span>
      <span>
        <span class="zone">${escapeHtml(zone.label)}</span><br>
        <span class="feel">${escapeHtml(feel)}</span><br>
        <span class="support">${escapeHtml(side.support[zoneIndex])} ${escapeHtml(copy.ui.support)}</span>
      </span>
    </div>`;
}

function bedMap(copy, bed, zones) {
  const rows = zones.map((zone, zoneIndex) =>
    bed.sides.map((side, sideIndex) => bedBlock(copy, side, sideIndex, zone, zoneIndex)).join("")).join("");
  return `<div class="bed-map sq" role="img" aria-label="${escapeHtml(copy.ui.bedMapLabel)}"><div class="bed-map-head"></div>${rows}</div>`;
}

function sideSummary(copy, side, index) {
  return `
    <div class="card sq fit-side" data-sleeper="${index}">
      <p class="eyebrow">${escapeHtml(sleeperLabel(copy, index))}</p>
      <p><strong>${escapeHtml(side.prebuild.name)}</strong><br><span class="muted">${escapeHtml(side.prebuild.blurb)}</span></p>
      <p class="muted">${escapeHtml(copy.ui.pillow)}: ${escapeHtml(side.pillow)}</p>
    </div>`;
}

export function resultView(copy, bed, bedData) {
  const online = bed.line.where === "online";
  return `
    <h1 tabindex="-1">${escapeHtml(copy.fit.reveal.headline)}</h1>
    <p class="lede">${escapeHtml(copy.fit.reveal.body)}</p>
    ${bedMap(copy, bed, bedData.zones)}
    <div class="fit-sides">${bed.sides.map((side, index) => sideSummary(copy, side, index)).join("")}</div>
    <section class="card sq fit-line">
      <span class="pill pill-honey">${escapeHtml(bed.line.name)}</span>
      <h2>${escapeHtml(copy.fit.result.headline)}</h2>
      <p>${escapeHtml(online ? copy.fit.result.onlineLine : copy.fit.result.storeLine)}</p>
    </section>
    <div class="btn-row">
      <a class="btn btn-accent sq" href="../stores/">${escapeHtml(copy.ui.sendToStore)}</a>
      <button class="btn btn-quiet sq" type="button" data-action="tune">${escapeHtml(copy.fit.paths.engineer.label)}</button>
      <button class="btn btn-quiet sq" type="button" data-action="back">${escapeHtml(copy.ui.back)}</button>
      <button class="btn btn-quiet sq" type="button" data-action="restart">${escapeHtml(copy.ui.startOver)}</button>
    </div>`;
}

/* ---------- Engineer path: tune each zone by hand ---------- */

const HEIGHTS = Array.from({ length: 27 }, (_, step) => 56 + step);   // 4 ft 8 in to 6 ft 10 in
const feetAndInches = inches => `${Math.floor(inches / 12)} ft ${inches % 12} in`;

/** One row of three choices, for example Plush, Medium, Firm. */
function levelPicker(legend, name, levels, chosen) {
  const options = levels.map(level =>
    `<label class="seg"><input type="radio" name="${name}" value="${escapeHtml(level)}"${level === chosen ? " checked" : ""}><span>${escapeHtml(level)}</span></label>`).join("");
  return `<fieldset class="seg-group"><legend>${escapeHtml(legend)}</legend><div class="seg-row sq">${options}</div></fieldset>`;
}

function zoneTuner(text, side, sideIndex, zone, zoneIndex) {
  return `
      <div class="tune-zone">
        <h3>${escapeHtml(zone.label)}</h3>
        ${levelPicker(text.comfort, `tune-${sideIndex}-comfort-${zoneIndex}`, COMFORT_LEVELS, side.comfort[zoneIndex])}
        ${levelPicker(text.support, `tune-${sideIndex}-support-${zoneIndex}`, SUPPORT_LEVELS, side.support[zoneIndex])}
      </div>`;
}

function bodyDetails(text, body, sideIndex) {
  const heights = HEIGHTS.map(inches =>
    `<option value="${inches}"${body?.height === inches ? " selected" : ""}>${feetAndInches(inches)}</option>`).join("");
  return `
      <details class="tune-body"${body ? " open" : ""}>
        <summary>${escapeHtml(text.bodyDetails)}</summary>
        <div class="tune-body-fields">
          <label>${escapeHtml(text.height)}
            <select name="body-${sideIndex}-height"><option value="">${escapeHtml(text.heightUnknown)}</option>${heights}</select>
          </label>
          <label>${escapeHtml(text.weight)}
            <input type="number" name="body-${sideIndex}-weight" inputmode="numeric" min="80" max="450" value="${body?.weight ?? ""}">
          </label>
        </div>
        <p class="field-hint">${escapeHtml(text.bodyNote)}</p>
      </details>`;
}

function sideTuner(copy, flow, side, sideIndex, zones) {
  const text = copy.fit.tune;
  return `
    <section class="card sq tune-side" data-sleeper="${sideIndex}">
      <p class="eyebrow fit-who" data-sleeper="${sideIndex}">${escapeHtml(sleeperLabel(copy, sideIndex))}</p>
      <div class="tune-status" data-rank="${side.alignmentRank}">
        <p><span class="muted">${escapeHtml(text.alignment)}:</span> <strong>${escapeHtml(side.alignment)}</strong></p>
        <p class="muted">${escapeHtml(side.hint)}</p>
        <p class="muted">${escapeHtml(copy.ui.pillow)}: ${escapeHtml(side.pillow)}</p>
      </div>
      ${bodyDetails(text, (flow.body || [])[sideIndex], sideIndex)}
      ${zones.map((zone, zoneIndex) => zoneTuner(text, side, sideIndex, zone, zoneIndex)).join("")}
      <p class="tune-foot">
        <span class="pill">${escapeHtml(side.isTuned ? text.yourOwn : text.suggested)}</span>
        ${side.isTuned ? `<button class="btn btn-small btn-quiet sq" type="button" data-action="reset" data-side="${sideIndex}">${escapeHtml(text.reset)}</button>` : ""}
      </p>
    </section>`;
}

export function tuneView(copy, flow, bed, bedData) {
  const sides = flow.solo ? [bed.sides[0]] : bed.sides;
  return `
    <h1 tabindex="-1">${escapeHtml(copy.fit.tune.headline)}</h1>
    <p class="lede">${escapeHtml(copy.fit.tune.body)}</p>
    <div class="tune-sides" data-count="${sides.length}">${sides.map((side, index) => sideTuner(copy, flow, side, index, bedData.zones)).join("")}</div>
    <p class="fit-line-now" aria-live="polite"><span class="pill pill-honey">${escapeHtml(bed.line.name)}</span></p>
    <div class="btn-row">
      <button class="btn btn-accent sq" type="button" data-action="next">${escapeHtml(copy.fit.tune.done)}</button>
    </div>`;
}
