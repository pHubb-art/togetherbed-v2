/** Put values into a copy template: "Hello {name}" + { name: "Sam" } -> "Hello Sam". Unknown names stay as written. */
export function fillTemplate(template, values) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match);
}
