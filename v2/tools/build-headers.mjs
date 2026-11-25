/**
 * Stamps the shared header into the Sleep Fit, stores and shop pages,
 * between their "site-header:start" and "site-header:end" comments.
 * Run after changing the navigation labels in data/copy.json:
 *   npm run build
 */
import fs from "node:fs";
import { siteHeaderHtml } from "./site-header.mjs";

const root = new URL("../", import.meta.url);
const copy = JSON.parse(fs.readFileSync(new URL("data/copy.json", root), "utf8"));
const SLOT = /(<!-- site-header:start -->)[\s\S]*?(<!-- site-header:end -->)/;

for (const page of ["fit", "stores", "shop"]) {
  const file = new URL(`${page}/index.html`, root);
  const html = fs.readFileSync(file, "utf8");
  if (!SLOT.test(html)) throw new Error(`${page}/index.html has no site-header slot`);
  fs.writeFileSync(file, html.replace(SLOT, (_, start, end) => `${start}\n  ${siteHeaderHtml(copy.nav, page, "../")}\n  ${end}`));
  console.log(`${page}/index.html header written`);
}
