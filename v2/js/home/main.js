/**
 * Homepage: a still picture of the bed shows first. The 3D bed replaces it
 * when the device can take it, and follows the visitor's own scrolling.
 */
import { chapterProgress } from "./scroll-progress.js";
import { togetherAt } from "./chapter-layout.js";

const stage = document.getElementById("bed-stage");
const canvas = document.getElementById("bed-canvas");
const chapters = [...document.querySelectorAll("[data-chapter]")];

function shouldLoad3d() {
  const connection = navigator.connection || {};
  if (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")) return false;   // respect data saver and very slow links
  return Boolean(window.WebGLRenderingContext);
}

async function start3d() {
  try {
    const { createBedScene } = await import("./bed-scene.js");
    const bed = createBedScene(canvas);
    await bed.ready;
    stage.classList.add("is-3d");

    const update = () => bed.setProgress(chapterProgress(chapters));
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", () => { bed.resize(); update(); });
    update();
  } catch (error) {
    // The still picture stays in place, and the story reads the same without 3D.
    console.warn("3D bed unavailable:", error);
  }
}

/** The two color shapes behind the bed slide together as the story reaches the partner. */
function followStoryWithColor() {
  const pair = document.getElementById("story-pair");
  let queued = false;
  const update = () => { queued = false; pair.style.setProperty("--together", togetherAt(chapterProgress(chapters)).toFixed(3)); };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
}

function markCurrentChapter() {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle("is-current", entry.isIntersecting);
  }, { rootMargin: "-45% 0px -45% 0px" });
  chapters.forEach(chapter => observer.observe(chapter));
}

followStoryWithColor();
markCurrentChapter();
if (shouldLoad3d()) {
  // Wait until the page is idle so the 3D never delays the first view.
  (window.requestIdleCallback || (callback => setTimeout(callback, 600)))(start3d);
}
