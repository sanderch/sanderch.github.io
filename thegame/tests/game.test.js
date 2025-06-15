// Test for main game logic (game.js)
// This is a basic Jest test scaffold. Adjust as needed for your test runner.
// Note: game.js is tightly coupled to the DOM/canvas, so we focus on logic that can be tested in isolation.

// Only define Image if not already defined (for Node.js test environment)
if (typeof global !== 'undefined' && typeof global.Image === 'undefined') {
  global.Image = class {};
}

import { createCharacter } from '../js/entities.js';
import { getDirectionIndex } from '../js/direction.js';

// Example: test character creation

describe('createCharacter', () => {
  it('creates a peasant with correct properties', () => {
    const p = createCharacter('peasant', 10, 20);
    expect(p.type).toBe('peasant');
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
    expect(p.selected).toBe(false);
    expect(p.path).toEqual([]);
    expect(p.life).toBe(p.maxLife);
  });
});

// Example: test direction logic

describe('getDirectionIndex', () => {
  it('returns right direction for angle 0', () => {
    expect(getDirectionIndex(0)).toEqual({ index: 2, mirrored: false });
  });
  it('returns down direction for angle PI/2', () => {
    expect(getDirectionIndex(Math.PI / 2)).toEqual({ index: 4, mirrored: false });
  });
});

// For more complex game.js logic, consider refactoring logic into testable pure functions.
