import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InstancedObjects } from '../render/InstancedObjects.js';

// --- geometry: a broadleaf tree merged into one buffer (trunk + canopy) with
// per-vertex colours, so the whole forest renders from a single material. ---
function paint(geo, hex, jitter = 0.05) {
  const col = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const j = (Math.random() - 0.5) * jitter;
    arr[i * 3] = THREE.MathUtils.clamp(col.r + j, 0, 1);
    arr[i * 3 + 1] = THREE.MathUtils.clamp(col.g + j, 0, 1);
    arr[i * 3 + 2] = THREE.MathUtils.clamp(col.b + j, 0, 1);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function buildTreeGeometry() {
  // all parts must be non-indexed for mergeGeometries (Icosahedron is, Cylinder isn't)
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.16, 0.28, 2.0, 7).translate(0, 1.0, 0).toNonIndexed();
  paint(trunk, '#5b4327', 0.04);
  parts.push(trunk);

  for (const [r, dx, dy, dz] of [
    [1.25, 0, 2.6, 0], [0.95, 0.7, 3.2, 0.2], [0.9, -0.6, 3.1, -0.35], [0.8, 0.15, 3.7, -0.1],
  ]) {
    const blob = new THREE.IcosahedronGeometry(r, 1).translate(dx, dy, dz).toNonIndexed();
    paint(blob, '#3f6b32', 0.07);
    parts.push(blob);
  }

  const geo = mergeGeometries(parts, false);
  geo.computeVertexNormals();
  return geo;
}

// Public: build the renderer for all trees.
export function createForest(capacity = 200000) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true,
  });
  return new InstancedObjects(buildTreeGeometry(), material, capacity);
}

// Per-instance variation captured as data on the GameObject (serializable).
export function treeData(x, z, y = 0) {
  return {
    transform: { x, y, z },
    rotY: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.7,
    tint: 0.82 + Math.random() * 0.3,
  };
}
