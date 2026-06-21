import * as THREE from 'three';
import { makeGrassTextures } from '../render/textures.js';

// Deterministic value-noise + fBm. Domain is world units; returns ~0..1.
function makeNoise(seed = 1) {
  const hash = (x, z) => {
    const s = Math.sin(x * 127.1 + z * 311.7 + seed * 0.017) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };
  return (x, z) => {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < 5; o++) { sum += amp * vnoise(x * freq, z * freq); norm += amp; amp *= 0.5; freq *= 2; }
    return sum / norm;
  };
}

// The map surface: a heightmapped terrain with water. Public API (size, heightAt,
// surface raycast target, tile<->world) is what the rest of the game depends on;
// the design swaps this single mesh for streamed chunks later without changing it.
export class Terrain {
  constructor({ size = 400, tileSize = 2, seed = 7 } = {}) {
    this.size = size;
    this.tileSize = tileSize;
    this.waterLevel = 0;
    this.snowLevel = 17;
    this.group = new THREE.Group();

    const baseNoise = makeNoise(seed);
    const peakNoise = makeNoise(seed + 53);
    const f0 = 1 / 95;
    // elevation field: rolling base + sparse sharp mountains, baseline sunk so
    // basins fall below sea level and fill with water.
    this._height = (x, z) => {
      const base = baseNoise(x * f0, z * f0);
      const peak = Math.pow(peakNoise(x * f0 * 0.5 + 100, z * f0 * 0.5 + 100), 3);
      return base * 9 + peak * 30 - 4.5;
    };

    this.#buildSurface();
    this.#buildWater();
  }

  #buildSurface() {
    const segs = 256;
    const geo = new THREE.PlaneGeometry(this.size, this.size, segs, segs);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      // plane is XY then rotated -90° about X, so world z = -localY, world up = localZ
      pos.setZ(i, this._height(pos.getX(i), -pos.getY(i)));
    }
    geo.computeVertexNormals();

    // elevation + slope based vertex colours: sand → grass → rock → snow
    const sand = new THREE.Color('#cabd8e'), grass = new THREE.Color('#4d7a37');
    const rock = new THREE.Color('#6f6657'), snow = new THREE.Color('#eef2f5');
    const nrm = geo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getZ(i), slopeY = nrm.getZ(i); // localZ normal = world up
      if (h < this.waterLevel + 0.6) tmp.copy(sand);
      else {
        const rockK = 1 - THREE.MathUtils.smoothstep(slopeY, 0.72, 0.9);
        tmp.copy(grass).lerp(rock, rockK);
        tmp.lerp(snow, THREE.MathUtils.smoothstep(h, this.snowLevel - 3, this.snowLevel + 2));
      }
      const j = (Math.random() - 0.5) * 0.05;
      colors[i * 3] = THREE.MathUtils.clamp(tmp.r + j, 0, 1);
      colors[i * 3 + 1] = THREE.MathUtils.clamp(tmp.g + j, 0, 1);
      colors[i * 3 + 2] = THREE.MathUtils.clamp(tmp.b + j, 0, 1);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const { bumpMap } = makeGrassTextures();
    bumpMap.repeat.set(this.size / 6, this.size / 6);
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, bumpMap, bumpScale: 0.5, roughness: 1, metalness: 0,
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.castShadow = true;
    ground.receiveShadow = true;
    this.group.add(ground);
    this.surface = ground;
  }

  #buildWater() {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(this.size, this.size),
      new THREE.MeshStandardMaterial({
        color: '#2f5d7c', transparent: true, opacity: 0.82,
        roughness: 0.12, metalness: 0.0, envMapIntensity: 1.4,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = this.waterLevel;
    this.group.add(water);
    this.water = water;
  }

  heightAt(x, z) { return this._height(x, z); }

  worldToTile(x, z) { return { tx: Math.round(x / this.tileSize), tz: Math.round(z / this.tileSize) }; }
  tileToWorld(tx, tz) { return { x: tx * this.tileSize, z: tz * this.tileSize }; }
  snap(x, z) { const { tx, tz } = this.worldToTile(x, z); return this.tileToWorld(tx, tz); }
}
