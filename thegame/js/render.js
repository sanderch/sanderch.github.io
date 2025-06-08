// Rendering functions
import { loadedSprites } from './sprites.js';
import { CHARACTER_TYPES } from './characterTypes.js';

export function drawPeasant(ctx, p) {
  const t = CHARACTER_TYPES[p.type];
  const sprite = loadedSprites[p.type];
  const sx = p.directionIndex * t.frameWidth;
  const sy = p.frame * t.frameHeight;
  const dx = p.x;
  const dy = p.y;

  ctx.save();
  if (p.mirrored) {
    ctx.translate(dx + t.frameWidth / 2, dy - t.frameHeight / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, sx, sy, t.frameWidth, t.frameHeight, -t.frameWidth / 2, 0, t.frameWidth, t.frameHeight);
  } else {
    ctx.drawImage(sprite, sx, sy, t.frameWidth, t.frameHeight, dx - t.frameWidth / 2, dy - t.frameHeight / 2, t.frameWidth, t.frameHeight);
  }
  ctx.restore();

  if (p.selected) {
    ctx.beginPath();
    ctx.arc(p.x, p.y + 10, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'yellow';
    ctx.stroke();
    if (p.maxLife > 1) {
      ctx.save();
      ctx.fillStyle = 'red';
      ctx.fillRect(p.x - 15, p.y - t.frameHeight / 2 - 8, 30, 4);
      ctx.fillStyle = 'lime';
      ctx.fillRect(p.x - 15, p.y - t.frameHeight / 2 - 8, 30 * (p.life / p.maxLife), 4);
      ctx.restore();
    }
  }
}

export function draw(ctx, canvas, peasants, building, dragSelect, dragStart, dragEnd, SHOW_GRID, TILE_SIZE) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ...existing code for grid, building, drag box, and peasants...
  // Call drawPeasant for each peasant
}
