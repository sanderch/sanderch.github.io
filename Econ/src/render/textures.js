import * as THREE from 'three';

// Procedural grass: a noisy green colour map plus a bump map, generated on a
// canvas so the project needs no image assets. Tiled across the terrain.
export function makeGrassTextures() {
  const S = 256;
  const col = document.createElement('canvas'); col.width = col.height = S;
  const bmp = document.createElement('canvas'); bmp.width = bmp.height = S;
  const c = col.getContext('2d');
  const b = bmp.getContext('2d');

  c.fillStyle = '#4f7a3a'; c.fillRect(0, 0, S, S);
  b.fillStyle = '#808080'; b.fillRect(0, 0, S, S);

  // speckled blades: short strokes with colour + height variation
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const t = Math.random();
    const r = 60 + t * 50, g = 100 + t * 70, bl = 40 + t * 40;
    c.strokeStyle = `rgb(${r|0},${g|0},${bl|0})`;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 3, y - 1 - Math.random() * 2); c.stroke();
    const sh = 90 + (t * 120) | 0;
    b.fillStyle = `rgb(${sh},${sh},${sh})`;
    b.fillRect(x, y, 1.5, 1.5);
  }
  // a few darker earthy patches for large-scale variation
  for (let i = 0; i < 24; i++) {
    const x = Math.random() * S, y = Math.random() * S, rad = 16 + Math.random() * 36;
    const grad = c.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, 'rgba(60,52,32,0.30)');
    grad.addColorStop(1, 'rgba(60,52,32,0)');
    c.fillStyle = grad; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  }

  const map = new THREE.CanvasTexture(col);
  const bumpMap = new THREE.CanvasTexture(bmp);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  return { map, bumpMap };
}
