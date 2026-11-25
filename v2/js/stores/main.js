/**
 * Store finder page: lists stores, filters them, and for a chosen store shows
 * the result email, a copy button, a mailto link and the call-ahead number.
 * All visible words come from data/copy.json.
 */
import { loadJson } from "../shared/load-json.js";
import { readState } from "../shared/storage.js";
import { buildBed } from "../fit-page/build-bed.js";
import { fillTemplate } from "../shared/fill-template.js";
import { filterStores, emailText, mailtoLink, telLink } from "./handoff.js";

const app = document.getElementById("stores-app");
let copy, bedData, stores, bed = null;
let query = "";
let toastTimer;

const escapeHtml = text => String(text ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

/** The bed from a finished Sleep Fit, or null when there is none. */
function savedBed() {
  const flow = readState("fit-flow", null);
  if (!flow || flow.screen !== "result") return null;
  try { return buildBed(flow, bedData); } catch (error) { return null; }
}

function resultNote() {
  const text = copy.storeHandoff;
  if (!bed) {
    return `<div class="card sq stores-note"><p>${escapeHtml(text.noResult)}</p><a class="btn btn-accent sq" href="../fit/">${escapeHtml(text.fitLink)}</a></div>`;
  }
  const summary = fillTemplate(text.resultReady, { left: bed.sides[0].prebuild.name, right: bed.sides[1].prebuild.name, line: bed.line.name });
  return `<div class="card sq stores-note"><span class="pill pill-honey">${escapeHtml(bed.line.name)}</span><p>${escapeHtml(summary)}</p></div>`;
}

function storeItem(store) {
  const text = copy.storeHandoff;
  const samples = store.hasSamples ? `<span class="pill">${escapeHtml(text.hasSamples)}</span>` : "";
  return `
    <li class="card sq store-card">
      <h2>${escapeHtml(store.name)}</h2>
      <p class="muted">${escapeHtml(store.address)}<br>${escapeHtml(`${store.city}, ${store.region} ${store.zip}`)}</p>
      ${samples}
      <button class="btn btn-quiet sq" type="button" data-action="choose" data-store="${escapeHtml(store.id)}">${escapeHtml(bed ? text.chooseCta : text.chooseCtaNoResult)}</button>
    </li>`;
}

function storeListHtml() {
  const matches = filterStores(stores, query);
  const count = fillTemplate(copy.storeHandoff.matchCount, { shown: matches.length, total: stores.length });
  const items = matches.length
    ? `<ul class="store-list" aria-label="${escapeHtml(copy.storeHandoff.listLabel)}">${matches.map(storeItem).join("")}</ul>`
    : `<p class="muted">${escapeHtml(copy.storeHandoff.noMatches)}</p>`;
  return `<p class="field-hint" role="status">${escapeHtml(count)}</p>${items}`;
}

function listView() {
  const text = copy.storeHandoff;
  return `
    <h1 tabindex="-1">${escapeHtml(text.headline)}</h1>
    <p class="lede">${escapeHtml(text.body)}</p>
    ${resultNote()}
    <div class="field">
      <label for="store-filter">${escapeHtml(text.filterLabel)}</label>
      <input id="store-filter" class="sq" type="search" autocomplete="off" aria-describedby="store-filter-hint" value="${escapeHtml(query)}">
      <p id="store-filter-hint" class="field-hint">${escapeHtml(text.filterHint)}</p>
    </div>
    <div id="store-results">${storeListHtml()}</div>
    <p class="field-hint">${escapeHtml(text.sampleNote)}</p>`;
}

function emailBlock(store) {
  const text = copy.storeHandoff;
  if (!bed) {
    return `<div class="card sq stores-note"><p>${escapeHtml(text.noResult)}</p><a class="btn btn-accent sq" href="../fit/">${escapeHtml(text.fitLink)}</a></div>`;
  }
  const body = emailText(bed, bedData, copy, store);
  const lineNote = store.lines.includes(bed.line.id) || bed.line.where === "online"
    ? ""
    : `<p class="muted">${escapeHtml(fillTemplate(text.lineNotListed, { line: bed.line.name }))}</p>`;
  return `
    <section class="handoff" aria-labelledby="preview-heading">
      <h2 id="preview-heading">${escapeHtml(fillTemplate(text.previewHeading, { store: store.name }))}</h2>
      <p class="muted">${escapeHtml(text.previewHint)}</p>
      ${lineNote}
      <div id="email-preview" class="handoff-preview sq" tabindex="0">${escapeHtml(body)}</div>
      <div class="btn-row">
        <button class="btn btn-quiet sq" type="button" data-action="copy">${escapeHtml(text.copyCta)}</button>
        <a class="btn btn-accent sq" href="${escapeHtml(mailtoLink(store, text.emailSubject, body))}">${escapeHtml(text.emailCta)}</a>
      </div>
    </section>`;
}

function storeView(store) {
  const text = copy.storeHandoff;
  return `
    <button class="btn btn-quiet btn-small sq" type="button" data-action="list">${escapeHtml(text.changeStore)}</button>
    <h1 tabindex="-1">${escapeHtml(store.name)}</h1>
    <p class="muted">${escapeHtml(store.address)}<br>${escapeHtml(`${store.city}, ${store.region} ${store.zip}`)}</p>
    ${emailBlock(store)}
    <section class="call-ahead sq" aria-labelledby="call-heading">
      <h2 id="call-heading">${escapeHtml(text.callAhead.headline)}</h2>
      <p>${escapeHtml(text.callAhead.body)}</p>
      <a class="phone" href="${escapeHtml(telLink(store.phone))}" aria-label="${escapeHtml(`${fillTemplate(text.callLabel, { store: store.name })}, ${store.phone}`)}">${escapeHtml(store.phone)}</a>
    </section>`;
}

function show(html) {
  app.innerHTML = html;
  window.scrollTo({ top: 0 });
  app.querySelector("h1")?.focus({ preventScroll: true });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast sq";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function selectPreview() {
  const preview = document.getElementById("email-preview");
  const range = document.createRange();
  range.selectNodeContents(preview);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  preview.focus();
}

async function copyEmail() {
  const text = document.getElementById("email-preview").textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast(copy.storeHandoff.copied);
  } catch (error) {
    selectPreview();
    showToast(copy.storeHandoff.copyFallback);
  }
}

const ACTIONS = {
  choose: button => {
    const store = stores.find(entry => entry.id === button.dataset.store);
    if (store) show(storeView(store));
  },
  list: () => show(listView()),
  copy: () => copyEmail()
};

app.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (button && ACTIONS[button.dataset.action]) ACTIONS[button.dataset.action](button);
});

app.addEventListener("input", event => {
  if (event.target.id !== "store-filter") return;
  query = event.target.value;
  document.getElementById("store-results").innerHTML = storeListHtml();
});

async function start() {
  try {
    [copy, bedData, { stores }] = await Promise.all([loadJson("data/copy.json"), loadJson("data/beds.json"), loadJson("data/stores.json")]);
  } catch (error) {
    app.textContent = "The store finder could not load. Please refresh the page.";
    return;
  }
  bed = savedBed();
  app.innerHTML = listView();
}

start();
