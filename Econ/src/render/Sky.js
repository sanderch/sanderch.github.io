import * as THREE from 'three';

// Procedural sky: a vertical gradient used both as the background and, via
// PMREM, as the image-based lighting environment that gives PBR materials
// realistic reflections and ambient light.
export function installSky(renderer, scene) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.00, '#3b6ea8');   // zenith
  g.addColorStop(0.45, '#9cc0e6');   // sky
  g.addColorStop(0.50, '#cfe0ee');   // horizon haze
  g.addColorStop(0.52, '#9aa589');   // ground bounce
  g.addColorStop(1.00, '#3f4a31');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  scene.background = tex;
  scene.fog = new THREE.Fog('#bcd0e2', 120, 420);

  pmrem.dispose();
}
