// Entity creation and management
import { CHARACTER_TYPES } from './characterTypes.js';
import { buildingSprite } from './sprites.js';
import { TILE_SIZE } from './config.js';

export function createCharacter(type, x, y) {
  const t = CHARACTER_TYPES[type];
  return {
    type,
    x,
    y,
    path: [],
    speed: t.speed,
    selected: false,
    frame: 0,
    frameTimer: 0,
    frameInterval: 10,
    directionIndex: 0,
    mirrored: false,
    life: t.maxLife,
    maxLife: t.maxLife,
  };
}

export const building = {
  image: buildingSprite,
  x: 400,
  y: 300,
  width: 122,
  height: 107
};
