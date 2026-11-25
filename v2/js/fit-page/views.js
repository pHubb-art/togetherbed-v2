/**
 * Sleep Fit screens. Each function returns the HTML for one screen.
 * All visible words come from data/copy.json; nothing is written here.
 */
const escapeHtml = text => String(text ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const sleeperLabel = (copy, index) => copy.ui.sleepers[index];

export function introView(copy) {
  const { quick, skip } = copy.fit.paths;
  return `
    <h1 tabindex="-1">${escapeHtml(copy.fit.headline)}</h1>
    <p class="lede">${escapeHtml(copy.fit.intro)}</p>
    <div class="choices fit-paths">
      <button class="choice sq" type="button" data-action="next"><strong>${escapeHtml(quick.label)}</strong><span>${escapeHtml(quick.blurb)}</span></button>
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
      <button class="btn btn-quiet sq" type="button" data-action="back">${escapeHtml(copy.ui.back)}</button>
      <button class="btn btn-quiet sq" type="button" data-action="restart">${escapeHtml(copy.ui.startOver)}</button>
    </div>`;
}
