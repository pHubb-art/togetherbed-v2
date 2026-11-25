/**
 * Small wrapper around sessionStorage.
 * Keys start with "tbv2-" so they never collide with the existing site's keys.
 * Every call is safe when storage is blocked (private windows, embeds).
 */
const PREFIX = "tbv2-";

export function saveState(name, value) {
  try { sessionStorage.setItem(PREFIX + name, JSON.stringify(value)); } catch (error) { /* storage unavailable */ }
}

export function readState(name, fallback) {
  try {
    const raw = sessionStorage.getItem(PREFIX + name);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function clearState(name) {
  try { sessionStorage.removeItem(PREFIX + name); } catch (error) { /* storage unavailable */ }
}
