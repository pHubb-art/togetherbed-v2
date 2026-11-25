import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { filterStores, emailText, mailtoLink, telLink } from "../js/stores/handoff.js";
import { newFlow } from "../js/fit-page/flow.js";
import { buildBed } from "../js/fit-page/build-bed.js";

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const beds = readJson("beds.json");
const copy = readJson("copy.json");
const { stores } = readJson("stores.json");

function twoSleeperBed() {
  const flow = { ...newFlow(), screen: "result" };
  flow.answers = [{ pose: "side", build: "lighter", pain: ["shoulders"] }, { pose: "stomach", build: "heavier", pain: ["back"] }];
  return buildBed(flow, beds);
}

test("an empty filter keeps every store", () => {
  assert.equal(filterStores(stores, "").length, stores.length);
  assert.equal(filterStores(stores, "   ").length, stores.length);
});

test("the filter matches city, state and ZIP, ignoring case", () => {
  assert.deepEqual(filterStores(stores, "austin").map(store => store.id), ["s1"]);
  assert.deepEqual(filterStores(stores, "co").map(store => store.id), ["s2"]);
  assert.deepEqual(filterStores(stores, "60607").map(store => store.id), ["s3"]);
  assert.deepEqual(filterStores(stores, "San Diego, CA").map(store => store.id), ["s5"]);
  assert.deepEqual(filterStores(stores, "zzz"), []);
});

test("the email names the store and lists both sides zone by zone", () => {
  const bed = twoSleeperBed();
  const text = emailText(bed, beds, copy, stores[0]);
  assert.ok(text.includes(stores[0].name));
  copy.ui.sleepers.forEach(label => assert.ok(text.includes(label.toUpperCase())));
  bed.sides.forEach(side => {
    assert.ok(text.includes(side.prebuild.name));
    beds.zones.forEach((zone, index) =>
      assert.ok(text.includes(`${zone.label}: ${side.comfort[index]} ${copy.ui.comfort}, ${side.support[index]} ${copy.ui.support}`)));
  });
  assert.ok(text.includes(bed.line.name));
  assert.ok(text.includes(copy.storeHandoff.emailBodyIntro));
  assert.equal(text.split(`${copy.ui.pillow}:`).length - 1, 2);
});

test("the mailto link encodes the subject and body", () => {
  const link = mailtoLink({ email: "fit@sample-store.test" }, "A & B?", "Line one\nHead & shoulders: 100%");
  assert.equal(link, "mailto:fit@sample-store.test?subject=A%20%26%20B%3F&body=Line%20one%0D%0AHead%20%26%20shoulders%3A%20100%25");
  const url = new URL(link);
  assert.equal(url.searchParams.get("subject"), "A & B?");
  assert.equal(url.searchParams.get("body"), "Line one\r\nHead & shoulders: 100%");
});

test("a full result email survives the round trip through the mailto link", () => {
  const body = emailText(twoSleeperBed(), beds, copy, stores[2]);
  const link = mailtoLink(stores[2], copy.storeHandoff.emailSubject, body);
  assert.equal(new URL(link).searchParams.get("body"), body.replace(/\n/g, "\r\n"));
});

test("the tel link keeps only the digits", () => {
  assert.equal(telLink("(512) 555-0142"), "tel:5125550142");
});
