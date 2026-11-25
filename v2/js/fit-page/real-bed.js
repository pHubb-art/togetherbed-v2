/**
 * "See it on the real bed": the 3D bed with the top off, its six comfort
 * blocks colored for this visitor's build. The 3D code and models are large,
 * so nothing here is downloaded until the visitor asks for it.
 */
const OPEN_BED_CHAPTER = 5;   // the story pose with the cover off and both sides showing (see home/chapter-layout.js)

let holder = null, scene = null, opened = false;

function makeHolder() {
  holder = document.createElement("div");
  holder.className = "real-bed-view";
  holder.innerHTML = "<canvas></canvas>";
}

/** True once the visitor has opened the 3D bed, so later screens keep it open. */
export const realBedIsOpen = () => opened;

/**
 * @param slot    the element on the result screen that holds the 3D view
 * @param colors  { left: [3 hex], right: [3 hex] } zone colors, head to foot
 * @returns false when 3D is not available on this device
 */
export async function showRealBed(slot, colors) {
  opened = true;
  if (!holder) makeHolder();
  slot.replaceChildren(holder);   // moving the same canvas keeps the 3D bed alive between screens
  try {
    if (!scene) {
      const { createBedScene } = await import("../home/bed-scene.js");
      scene = createBedScene(holder.querySelector("canvas"));
      await scene.ready;
      scene.setProgress(OPEN_BED_CHAPTER);
      addEventListener("resize", () => scene.resize());
    }
    scene.setBuildColors(colors);
    scene.resize();
    holder.classList.add("is-ready");
    return true;
  } catch (error) {
    console.warn("3D bed unavailable:", error);
    scene = null; opened = false;
    return false;
  }
}
