// Sprite/image loading and management
import { CHARACTER_TYPES } from './characterTypes.js';

export const loadedSprites = {};
for (const type in CHARACTER_TYPES) {
  loadedSprites[type] = new Image();
  loadedSprites[type].src = CHARACTER_TYPES[type].sprite;
}

export const buildingSprite = new Image();
buildingSprite.src = 'img/human_citycenter.png';
