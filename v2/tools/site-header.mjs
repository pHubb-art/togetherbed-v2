/**
 * The one header every page shares: logo plus the four main links.
 * Pages are plain HTML, so the header is stamped into them at build time
 * (no JavaScript needed to show it, and search engines see real links).
 */
const PAGES = [
  { id: "home", path: "" },
  { id: "fit", path: "fit/" },
  { id: "stores", path: "stores/" },
  { id: "shop", path: "shop/" }
];

const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

/**
 * @param nav      labels from data/copy.json ("nav")
 * @param current  id of the page being built: home, fit, stores or shop
 * @param toRoot   path from that page back to the site root: "./" or "../"
 */
export function siteHeaderHtml(nav, current, toRoot) {
  const links = PAGES.map(page => {
    const here = page.id === current ? ' aria-current="page"' : "";
    return `          <li><a href="${toRoot}${page.path}"${here}>${escapeHtml(nav[page.id])}</a></li>`;
  }).join("\n");

  return `<header class="site-header">
    <div class="wrap">
      <a class="logo" href="${toRoot}" aria-label="${escapeHtml(nav.logoLabel)}">
        <svg viewBox="0 0 454.1 121" width="150" height="40" role="img" aria-label="TogetherBed"><use href="${toRoot}img/logo.svg#wordmark"></use></svg>
      </a>
      <nav class="site-nav" aria-label="${escapeHtml(nav.label)}">
        <ul>
${links}
        </ul>
      </nav>
    </div>
  </header>`;
}
