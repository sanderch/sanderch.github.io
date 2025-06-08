// Pathfinding and helpers
import { TILE_SIZE } from './config.js';

export function heuristic(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

export function getNeighbors(node, gridWidth, gridHeight) {
  const dirs = [
    [0, -1], [1, 0], [0, 1], [-1, 0],
    [-1, -1], [1, -1], [1, 1], [-1, 1]
  ];
  return dirs.map(([dx, dy]) => ({
    x: node.x + dx,
    y: node.y + dy,
    cost: dx !== 0 && dy !== 0 ? Math.SQRT2 : 1
  })).filter(n =>
    n.x >= 0 && n.x < gridWidth &&
    n.y >= 0 && n.y < gridHeight
  );
}

export function isTileOccupied(x, y, peasants, ignorePeasant = null) {
  return peasants.some(p => p !== ignorePeasant && Math.floor(p.x / TILE_SIZE) === x && Math.floor(p.y / TILE_SIZE) === y);
}

export function isBlocked(x, y, grid, peasants, peasant) {
  if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) return true;
  if (grid[y][x] === 1) return true;
  if (isTileOccupied(x, y, peasants, peasant)) return true;
  return false;
}

export function findPath(start, end, grid, peasants, ignorePeasant = null) {
  const startNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, end),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;

  const open = [startNode];
  const closed = new Set();
  const key = (x, y) => `${x},${y}`;

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();

    if (current.x === end.x && current.y === end.y) {
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.x, current.y));

    getNeighbors(current, grid[0].length, grid.length).forEach(neighbor => {
      if (isBlocked(neighbor.x, neighbor.y, grid, peasants, ignorePeasant) || closed.has(key(neighbor.x, neighbor.y)))
        return;

      const g = current.g + neighbor.cost;
      const h = heuristic(neighbor, end);
      const existing = open.find(n => n.x === neighbor.x && n.y === neighbor.y);

      if (!existing || g + h < existing.f) {
        const n = {
          ...neighbor,
          g,
          h,
          f: g + h,
          parent: current
        };
        if (!existing) open.push(n);
      }
    });
  }

  return []; // no path
}

// Additional pathfinding helpers will be added here
