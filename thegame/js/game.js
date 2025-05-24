// === CONFIGURATION ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const GRID_WIDTH = Math.ceil(canvas.width / TILE_SIZE);
const GRID_HEIGHT = Math.ceil(canvas.height / TILE_SIZE);

const SHOW_GRID = true;

// === CHARACTER TYPES ===
const CHARACTER_TYPES = {
  peasant: {
    name: 'Peasant',
    sprite: 'img/peasant.png',
    frameWidth: 26,
    frameHeight: 32,
    frames: 5,
    speed: 1.5,
    maxLife: 100,
    sounds: {}, // placeholder for future sound properties
    // Add more properties as needed
  },
  // Add more character types here in the future
};

// === SPRITES ===
const loadedSprites = {};
for (const type in CHARACTER_TYPES) {
  loadedSprites[type] = new Image();
  loadedSprites[type].src = CHARACTER_TYPES[type].sprite;
}

const building = {
  image: new Image(),
  x: 400,
  y: 300,
  width: 122,
  height: 107
};
building.image.src = 'img/human_citycenter.png';

// === GRID ===
const grid = Array.from({ length: GRID_HEIGHT }, () =>
  Array.from({ length: GRID_WIDTH }, () => 0)
);

function blockBuildingOnGrid(building) {
  const x0 = Math.floor((building.x - building.width / 2) / TILE_SIZE);
  const y0 = Math.floor((building.y - building.height / 2) / TILE_SIZE);
  const x1 = Math.ceil((building.x + building.width / 2) / TILE_SIZE);
  const y1 = Math.ceil((building.y + building.height / 2) / TILE_SIZE);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        grid[y][x] = 1;
      }
    }
  }
}
blockBuildingOnGrid(building);

// === PEASANTS ===
const peasants = [
  createCharacter('peasant', 100, 100),
  createCharacter('peasant', 200, 150),
  createCharacter('peasant', 300, 100)
];

function createCharacter(type, x, y) {
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
    // Add more instance properties as needed
  };
}

// === INPUT HANDLING ===
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

let dragSelect = false;
let dragStart = null;
let dragEnd = null;

canvas.addEventListener('mousedown', (e) => {
  const mouse = getMousePos(e);
  if (e.button === 0) {
    // Check for single-unit click selection first
    let clickedUnit = false;
    peasants.forEach(peasant => {
      const dx = mouse.x - peasant.x;
      const dy = mouse.y - peasant.y;
      const clicked = Math.hypot(dx, dy) < 25;
      if (clicked) {
        clickedUnit = true;
        if (e.shiftKey) {
          peasant.selected = !peasant.selected;
        } else {
          peasants.forEach(p => p.selected = false);
          peasant.selected = true;
        }
      }
    });

    // If not clicking on a unit, begin drag select
    if (!clickedUnit) {
      dragSelect = true;
      dragStart = mouse;
      dragEnd = mouse;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (dragSelect) {
    dragEnd = getMousePos(e);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0 && dragSelect) {
    dragSelect = false;
    const rect = {
      x: Math.min(dragStart.x, dragEnd.x),
      y: Math.min(dragStart.y, dragEnd.y),
      width: Math.abs(dragStart.x - dragEnd.x),
      height: Math.abs(dragStart.y - dragEnd.y)
    };

    peasants.forEach(p => {
      const inside = p.x >= rect.x && p.x <= rect.x + rect.width &&
                     p.y >= rect.y && p.y <= rect.y + rect.height;
      if (inside) {
        if (e.shiftKey) {
          p.selected = !p.selected;
        } else {
          p.selected = true;
        }
      } else if (!e.shiftKey) {
        p.selected = false;
      }
    });
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const mouse = getMousePos(e);
  let tileEnd = {
    x: Math.floor(mouse.x / TILE_SIZE),
    y: Math.floor(mouse.y / TILE_SIZE)
  };

  // Helper to get all walkable neighbors around a blocked area
  function getClosestWalkableNeighbor(blockedX, blockedY, peasant, fromTile) {
    let visited = new Set();
    let queue = [{x: blockedX, y: blockedY, dist: 0}];
    let best = null;
    let minDist = Infinity;
    while (queue.length > 0) {
      const {x, y, dist} = queue.shift();
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      getNeighbors({x, y}).forEach(n => {
        if (!isBlocked(n.x, n.y, peasant)) {
          // Compute distance from original peasant position
          const d = Math.abs(n.x - fromTile.x) + Math.abs(n.y - fromTile.y);
          if (d < minDist) {
            minDist = d;
            best = {x: n.x, y: n.y};
          }
        } else if (!visited.has(`${n.x},${n.y}`) && grid[n.y][n.x] === 1) {
          // If still blocked (e.g. part of a big building), keep searching
          queue.push({x: n.x, y: n.y, dist: dist + 1});
        }
      });
    }
    return best;
  }

  peasants.forEach(peasant => {
    if (peasant.selected) {
      const tileStart = {
        x: Math.floor(peasant.x / TILE_SIZE),
        y: Math.floor(peasant.y / TILE_SIZE)
      };
      let dest = tileEnd;
      if (isBlocked(tileEnd.x, tileEnd.y, peasant)) {
        // Find closest walkable neighbor, even for multi-tile obstacles
        const best = getClosestWalkableNeighbor(tileEnd.x, tileEnd.y, peasant, tileStart);
        if (best) dest = best;
        else return; // No reachable neighbor
      }
      const tilePath = findPath(tileStart, dest, grid, peasant);
      peasant.path = tilePath.map(p => ({
        x: p.x * TILE_SIZE + TILE_SIZE / 2,
        y: p.y * TILE_SIZE + TILE_SIZE / 2
      }));
    }
  });
});

// === UPDATE LOOP ===
function update() {
  peasants.forEach(peasant => {
    const t = CHARACTER_TYPES[peasant.type];
    if (peasant.path.length > 0) {
      const target = peasant.path[0];
      const dx = target.x - peasant.x;
      const dy = target.y - peasant.y;
      const dist = Math.hypot(dx, dy);
      // Prevent moving into a tile occupied by another peasant
      const nextTileX = Math.floor(target.x / TILE_SIZE);
      const nextTileY = Math.floor(target.y / TILE_SIZE);
      if (isTileOccupied(nextTileX, nextTileY, peasant)) {
        // Wait until the tile is free
        return;
      }
      if (dist > peasant.speed) {
        const angle = Math.atan2(dy, dx);
        const dir = getDirectionIndex(angle);
        peasant.directionIndex = dir.index;
        peasant.mirrored = dir.mirrored;

        peasant.x += (dx / dist) * t.speed;
        peasant.y += (dy / dist) * t.speed;

        peasant.frameTimer++;
        if (peasant.frameTimer >= peasant.frameInterval) {
          peasant.frame = (peasant.frame + 1) % t.frames;
          peasant.frameTimer = 0;
        }
      } else {
        peasant.path.shift();
        peasant.frame = 0;
      }
    }
  });
}

// === DRAW ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid if enabled
  if (SHOW_GRID) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x <= canvas.width; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw building
  ctx.drawImage(
    building.image,
    building.x - building.width / 2,
    building.y - building.height / 2,
    building.width,
    building.height
  );

  // Draw drag box
  if (dragSelect) {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.strokeRect(
      Math.min(dragStart.x, dragEnd.x),
      Math.min(dragStart.y, dragEnd.y),
      Math.abs(dragStart.x - dragEnd.x),
      Math.abs(dragStart.y - dragEnd.y)
    );
  }

  // Draw peasants
  peasants.forEach(drawPeasant);
}

function drawPeasant(p) {
  // Draw any character type
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
  }
  // Draw life bar (optional, for demonstration)
  if (p.maxLife > 1) {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.fillRect(p.x - 15, p.y - t.frameHeight / 2 - 8, 30, 4);
    ctx.fillStyle = 'lime';
    ctx.fillRect(p.x - 15, p.y - t.frameHeight / 2 - 8, 30 * (p.life / p.maxLife), 4);
    ctx.restore();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === PATHFINDING ===
function heuristic(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

function getNeighbors(node) {
  const dirs = [
    [0, -1], [1, 0], [0, 1], [-1, 0],
    [-1, -1], [1, -1], [1, 1], [-1, 1]
  ];
  return dirs.map(([dx, dy]) => ({
    x: node.x + dx,
    y: node.y + dy,
    cost: dx !== 0 && dy !== 0 ? Math.SQRT2 : 1
  })).filter(n =>
    n.x >= 0 && n.x < GRID_WIDTH &&
    n.y >= 0 && n.y < GRID_HEIGHT
  );
}

function isTileOccupied(x, y, ignorePeasant = null) {
  // Returns true if any peasant (except ignorePeasant) occupies the tile (x, y)
  return peasants.some(p => p !== ignorePeasant && Math.floor(p.x / TILE_SIZE) === x && Math.floor(p.y / TILE_SIZE) === y);
}

function isBlocked(x, y, peasant) {
  // Returns true if the tile is blocked by a building, peasant, or any future obstacle
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return true;
  if (grid[y][x] === 1) return true; // Building or static obstacle
  if (isTileOccupied(x, y, peasant)) return true; // Peasant
  // Add more checks here for future obstacle types
  return false;
}

function findPath(start, end, grid, ignorePeasant = null) {
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

    getNeighbors(current).forEach(neighbor => {
      if (isBlocked(neighbor.x, neighbor.y, ignorePeasant) || closed.has(key(neighbor.x, neighbor.y)))
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

function getDirectionIndex(angle) {
  const deg = angle * (180 / Math.PI);
  if (deg >= -22.5 && deg < 22.5) return { index: 2, mirrored: false }; // Right
  if (deg >= 22.5 && deg < 67.5) return { index: 3, mirrored: false }; // Down-Right
  if (deg >= 67.5 && deg < 112.5) return { index: 4, mirrored: false }; // Down
  if (deg >= 112.5 && deg < 157.5) return { index: 3, mirrored: true }; // Down-Left
  if (deg >= 157.5 || deg < -157.5) return { index: 2, mirrored: true }; // Left
  if (deg >= -157.5 && deg < -112.5) return { index: 1, mirrored: true }; // Up-Left
  if (deg >= -112.5 && deg < -67.5) return { index: 0, mirrored: false }; // Up
  if (deg >= -67.5 && deg < -22.5) return { index: 1, mirrored: false }; // Up-Right
  return { index: 2, mirrored: false };
}

gameLoop();
