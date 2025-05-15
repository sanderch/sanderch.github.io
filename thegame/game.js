// === CONFIGURATION ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const GRID_WIDTH = Math.ceil(canvas.width / TILE_SIZE);
const GRID_HEIGHT = Math.ceil(canvas.height / TILE_SIZE);

const FRAME_WIDTH = 26;
const FRAME_HEIGHT = 32;
const FRAMES = 5;

// === SPRITES ===
const peasantSprite = new Image();
peasantSprite.src = 'peasant.png';

const building = {
    image: new Image(),
    x: 400,
    y: 300,
    width: 122,
    height: 107
};
building.image.src = 'human_citycenter.png';

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
    createPeasant(100, 100),
    createPeasant(200, 150),
    createPeasant(300, 100)
];

function createPeasant(x, y) {
    return {
        x,
        y,
        path: [],
        speed: 1.5,
        selected: false,
        frame: 0,
        frameTimer: 0,
        frameInterval: 10,
        directionIndex: 0,
        mirrored: false
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

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        const mouse = getMousePos(e);
        let found = false;
        peasants.forEach(peasant => {
            const dx = mouse.x - peasant.x;
            const dy = mouse.y - peasant.y;
            const clicked = Math.hypot(dx, dy) < 25;

            if (clicked) {
                found = true;
                if (e.shiftKey) {
                    peasant.selected = !peasant.selected;
                } else {
                    peasants.forEach(p => p.selected = false);
                    peasant.selected = true;
                }
            }
        });
        if (!found && !e.shiftKey) {
            peasants.forEach(p => p.selected = false);
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const mouse = getMousePos(e);
    const tileEnd = {
        x: Math.floor(mouse.x / TILE_SIZE),
        y: Math.floor(mouse.y / TILE_SIZE)
    };

    peasants.forEach(peasant => {
        if (peasant.selected) {
            const tileStart = {
                x: Math.floor(peasant.x / TILE_SIZE),
                y: Math.floor(peasant.y / TILE_SIZE)
            };
            const tilePath = findPath(tileStart, tileEnd, grid);
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
        if (peasant.path.length > 0) {
            const target = peasant.path[0];
            const dx = target.x - peasant.x;
            const dy = target.y - peasant.y;
            const dist = Math.hypot(dx, dy);

            if (dist > peasant.speed) {
                const angle = Math.atan2(dy, dx);
                const dir = getDirectionIndex(angle);
                peasant.directionIndex = dir.index;
                peasant.mirrored = dir.mirrored;

                peasant.x += (dx / dist) * peasant.speed;
                peasant.y += (dy / dist) * peasant.speed;

                peasant.frameTimer++;
                if (peasant.frameTimer >= peasant.frameInterval) {
                    peasant.frame = (peasant.frame + 1) % FRAMES;
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

    // Draw building
    ctx.drawImage(
        building.image,
        building.x - building.width / 2,
        building.y - building.height / 2,
        building.width,
        building.height
    );

    // Draw peasants
    peasants.forEach(drawPeasant);
}

function drawPeasant(p) {
    const sx = p.directionIndex * FRAME_WIDTH;
    const sy = p.frame * FRAME_HEIGHT;
    const dx = p.x;
    const dy = p.y;

    ctx.save();
    if (p.mirrored) {
        ctx.translate(dx + FRAME_WIDTH / 2, dy - FRAME_HEIGHT / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(peasantSprite, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, -FRAME_WIDTH / 2, 0, FRAME_WIDTH, FRAME_HEIGHT);
    } else {
        ctx.drawImage(peasantSprite, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, dx - FRAME_WIDTH / 2, dy - FRAME_HEIGHT / 2, FRAME_WIDTH, FRAME_HEIGHT);
    }
    ctx.restore();

    if (p.selected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y + 10, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'yellow';
        ctx.stroke();
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
        [0, -1],  // up
        [1, 0],   // right
        [0, 1],   // down
        [-1, 0],  // left
        [-1, -1], // up-left
        [1, -1],  // up-right
        [1, 1],   // down-right
        [-1, 1]   // down-left
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

function findPath(start, end, grid) {
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
            if (closed.has(key(neighbor.x, neighbor.y)) || grid[neighbor.y][neighbor.x] === 1)
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
