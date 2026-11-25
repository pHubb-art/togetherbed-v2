/**
 * Turns the page's scroll position into a chapter number with a fraction,
 * for example 2.5 = halfway between the third and fourth chapters.
 * The page scrolls natively; nothing here blocks or redirects scrolling.
 */
export function chapterProgress(chapters, viewportHeight = window.innerHeight) {
  const middle = viewportHeight / 2;
  let previousCenter = null;
  for (let index = 0; index < chapters.length; index++) {
    const box = chapters[index].getBoundingClientRect();
    const center = box.top + box.height / 2;
    if (center >= middle) {
      if (index === 0) return 0;
      return index - 1 + (middle - previousCenter) / (center - previousCenter);
    }
    previousCenter = center;
  }
  return chapters.length - 1;
}
