/**
 * Store handoff logic: filter the store list, write the result email,
 * and build the mailto and tel links. Pure logic with no page code.
 */
import { fillTemplate } from "../shared/fill-template.js";

function storeSearchText(store) {
  return `${store.city}, ${store.region} ${store.zip}`.toLowerCase();
}

/** Stores whose city, state or ZIP contains the query. An empty query keeps every store. */
export function filterStores(stores, query) {
  const needle = String(query ?? "").trim().toLowerCase();
  if (!needle) return stores;
  return stores.filter(store => storeSearchText(store).includes(needle));
}

function sideLines(side, sideIndex, bedData, copy) {
  const zoneLines = bedData.zones.map((zone, zoneIndex) =>
    `${zone.label}: ${side.comfort[zoneIndex]} ${copy.ui.comfort}, ${side.support[zoneIndex]} ${copy.ui.support}`);
  return [
    copy.ui.sleepers[sideIndex].toUpperCase(),
    `${copy.storeHandoff.emailPrebuild}: ${side.prebuild.name}`,
    `${copy.ui.pillow}: ${side.pillow}`,
    ...zoneLines
  ].join("\n");
}

/** The plain-text email: both sides zone by zone, pillow, pre-build and product line. */
export function emailText(bed, bedData, copy, store) {
  const handoff = copy.storeHandoff;
  return [
    fillTemplate(handoff.emailStoreLine, { store: store.name, city: store.city }),
    handoff.emailBodyIntro,
    ...bed.sides.map((side, index) => sideLines(side, index, bedData, copy)),
    `${handoff.emailLine}: ${bed.line.name}`,
    handoff.emailSignoff
  ].join("\n\n");
}

/** A mailto link with the subject and body encoded. Line breaks become CRLF, as mail apps expect. */
export function mailtoLink(store, subject, body) {
  const address = encodeURIComponent(store.email).replace("%40", "@");
  const encode = text => encodeURIComponent(String(text).replace(/\r?\n/g, "\r\n"));
  return `mailto:${address}?subject=${encode(subject)}&body=${encode(body)}`;
}

/** A tel link from a written phone number: "(512) 555-0142" -> "tel:5125550142". */
export function telLink(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, "")}`;
}
