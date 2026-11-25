/**
 * The 3D bed on the homepage.
 * Loaded only when the visitor's device and connection can take it (see main.js).
 * It draws a frame only when something changed, to save battery.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { COILS, CUBES, CUBES_BY_SIDE, poseAt } from "./chapter-layout.js";

const MODEL_FOLDER = new URL("../../models/", import.meta.url);
const MODEL_FILES = { base: "base.glb", coils: "coils.glb", comfort: "comfort.glb", relief: "relief.glb", cover: "cover-performance.glb" };
const FIELD_OF_VIEW = 30;

const normalize = name => (name || "").replace(/[\s._]/g, "").toLowerCase();

function findByName(root, name) {
  let hit = null;
  root.traverse(node => { if (!hit && normalize(node.name) === normalize(name)) hit = node; });
  return hit;
}

function readCssColor(name) {
  return new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#ffffff");
}

/**
 * @param canvas the <canvas> to draw into
 * @returns { setProgress(progress), resize(), ready } where ready resolves once the bed is on screen
 */
export function createBedScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 40);
  const turntable = new THREE.Group();
  scene.add(turntable);

  const parts = {};          // name -> { object, rest }
  const cubeMaterials = {};  // cube name -> [{ material, original }]
  const sideColors = { left: readCssColor("--sleeper-a"), right: readCssColor("--sleeper-b") };
  let buildColors = null;    // cube name -> color, when showing one visitor's own build
  let progress = 0, frameQueued = false, loaded = false;

  function addPart(name, object) {
    if (object) parts[name] = { object, rest: object.position.clone() };
  }

  function rememberCubeMaterials(name) {
    cubeMaterials[name] = [];
    parts[name]?.object.traverse(node => {
      if (!node.isMesh) return;
      node.material = node.material.clone();
      cubeMaterials[name].push({ material: node.material, original: node.material.color.clone() });
    });
  }

  function applyPose() {
    const pose = poseAt(progress);
    for (const [name, part] of Object.entries(parts)) {
      const [x, y, z] = pose.offsets[name] || [0, 0, 0];
      part.object.position.set(part.rest.x + x, part.rest.y + y, part.rest.z + z);
      part.object.visible = y < 2.4;   // parts lifted out of view are not drawn
    }
    for (const [side, cubes] of Object.entries(CUBES_BY_SIDE))
      for (const cube of cubes)
        for (const entry of cubeMaterials[cube] || []) {
          if (buildColors) entry.material.color.copy(entry.original).lerp(buildColors[cube], 0.85);
          else entry.material.color.copy(entry.original).lerp(sideColors[side], pose.sideTint * 0.75);
        }
    turntable.rotation.y = pose.yaw;
  }

  function draw() {
    frameQueued = false;
    if (!loaded) return;
    applyPose();
    renderer.render(scene, camera);
  }

  function queueFrame() {
    if (!frameQueued) { frameQueued = true; requestAnimationFrame(draw); }
  }

  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Pull the camera back on tall, narrow screens so the whole bed stays in frame.
    const distance = 5.2 * Math.max(1, 1.15 / camera.aspect);
    camera.position.set(0, distance * 0.52, distance * 0.86);
    camera.lookAt(0, 0.42, 0);
    camera.updateProjectionMatrix();
    queueFrame();
  }

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const loadModel = file => new Promise((resolve, reject) => loader.load(new URL(file, MODEL_FOLDER).href, resolve, undefined, reject));

  const ready = Promise.all(Object.values(MODEL_FILES).map(loadModel)).then(([base, coils, comfort, relief, cover]) => {
    for (const model of [base, coils, comfort, relief, cover]) turntable.add(model.scene);
    addPart("base", base.scene);
    for (const name of COILS) addPart(name, findByName(coils.scene, name));
    for (const name of CUBES) addPart(name, findByName(comfort.scene, name));
    addPart("mid", findByName(comfort.scene, "B6.002"));
    addPart("relief", findByName(relief.scene, "ReliefLayer") || relief.scene);
    addPart("cover", findByName(cover.scene, "Cover") || cover.scene);
    CUBES.forEach(rememberCubeMaterials);
    loaded = true;
    resize();
    draw();
  });

  return {
    ready,
    resize,
    setProgress(value) { if (value !== progress) { progress = value; queueFrame(); } },
    /**
     * Color each comfort block for one visitor's build.
     * @param colors { left: [3 hex colors], right: [3 hex colors] }, zones head to foot. Pass null to clear.
     */
    setBuildColors(colors) {
      buildColors = colors && Object.fromEntries(Object.entries(CUBES_BY_SIDE).flatMap(([side, cubes]) =>
        cubes.map((cube, zone) => [cube, new THREE.Color(colors[side][zone])])));
      queueFrame();
    }
  };
}
