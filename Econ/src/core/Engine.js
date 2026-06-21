import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { installSky } from '../render/Sky.js';

// The Engine owns the THREE.js renderer, scene, camera, lighting and the render
// loop. It is render-on-demand: it only redraws when something marks it dirty
// (camera movement or a model change). Per-frame logic registers via addUpdater.
export class Engine {
  constructor(container) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
    this.camera.position.set(40, 34, 40);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;          // static shadows, refreshed on demand
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.zoomToCursor = true;            // zoom toward cursor; keeps the pivot where you work
    this.controls.screenSpacePanning = false;     // pan across the ground plane (map-style)
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 400;
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener('change', () => this.invalidate());

    this.#installLights();
    installSky(this.renderer, this.scene);

    this.raycaster = new THREE.Raycaster();
    this._updaters = new Set();
    this._dirty = true;
    this._clock = new THREE.Clock();

    this.#installEdgeScroll();

    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.invalidate();
    });
  }

  // RTS edge scrolling: holding the cursor near a screen edge pans the camera
  // (and orbit target) across the ground, like a right-drag.
  #installEdgeScroll() {
    const MARGIN = 16;
    let px = -1, py = -1, inside = false, buttons = 0;
    const stop = () => { inside = false; buttons = 0; };
    addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; inside = true; });
    addEventListener('pointerleave', () => { inside = false; });
    addEventListener('pointerdown', () => { buttons++; });
    addEventListener('pointerup', () => { buttons = Math.max(0, buttons - 1); });
    addEventListener('blur', stop);                                   // window lost focus (alt-tab, other window)
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

    const dir = new THREE.Vector3(), right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0), move = new THREE.Vector3();
    this.addUpdater((dt) => {
      if (!inside || buttons > 0) return;                 // don't fight an active drag
      let ex = 0, ez = 0;
      if (px < MARGIN) ex = -1; else if (px > innerWidth - MARGIN) ex = 1;
      if (py < MARGIN) ez = 1; else if (py > innerHeight - MARGIN) ez = -1;
      if (!ex && !ez) return;

      this.camera.getWorldDirection(dir); dir.y = 0; dir.normalize();   // forward on the ground
      right.crossVectors(dir, up).normalize();
      move.set(0, 0, 0).addScaledVector(right, ex).addScaledVector(dir, ez);
      if (move.lengthSq() === 0) return;

      const speed = Math.max(8, this.controls.getDistance()) * 0.9 * dt; // scale with zoom
      move.normalize().multiplyScalar(speed);
      this.camera.position.add(move);
      this.controls.target.add(move);
      this.invalidate();
    });
  }

  #installLights() {
    this.scene.add(new THREE.HemisphereLight('#dcecff', '#46512f', 0.7));
    const sun = new THREE.DirectionalLight('#fff3df', 2.2);
    sun.position.set(80, 120, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    const s = 120;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 400 });
    this.scene.add(sun);
    this.sun = sun;
  }

  addUpdater(fn) { this._updaters.add(fn); return () => this._updaters.delete(fn); }
  invalidate() { this._dirty = true; }
  refreshShadows() { this.renderer.shadowMap.needsUpdate = true; this._dirty = true; }

  // Constrain panning so the orbit target can never leave the map.
  setMapBounds(half) { this._mapHalf = half; }
  #clampToMap() {
    const h = this._mapHalf;
    if (h === undefined) return;
    const t = this.controls.target;
    const cx = THREE.MathUtils.clamp(t.x, -h, h);
    const cz = THREE.MathUtils.clamp(t.z, -h, h);
    if (cx !== t.x || cz !== t.z) {
      // shift camera by the same amount so the view doesn't swing
      this.camera.position.x += cx - t.x;
      this.camera.position.z += cz - t.z;
      t.x = cx; t.z = cz;
      this._dirty = true;
    }
  }

  // Cast a screen-space pointer event into the scene against `targets`.
  pick(event, targets) {
    const p = new THREE.Vector2(
      (event.clientX / innerWidth) * 2 - 1,
      -(event.clientY / innerHeight) * 2 + 1,
    );
    this.raycaster.setFromCamera(p, this.camera);
    return this.raycaster.intersectObjects(targets, false);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, this._clock.getDelta());
      for (const u of this._updaters) u(dt);
      if (this.controls.update()) this._dirty = true;
      this.#clampToMap();
      if (this._dirty) { this.renderer.render(this.scene, this.camera); this._dirty = false; }
    };
    loop();
  }
}
