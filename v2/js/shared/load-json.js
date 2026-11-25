/** Load a JSON content file. Paths are relative to the v2 folder. */
const V2_ROOT = new URL("../../", import.meta.url);

export async function loadJson(path) {
  const response = await fetch(new URL(path, V2_ROOT));
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}
