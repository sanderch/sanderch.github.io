const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sprite = new Image();
sprite.src = 'peasant.png';

const FRAME_WIDTH = 26;
const FRAME_HEIGHT = 32;
const FRAMES = 5;

const peasants = [
  createPeasant(100, 100),
  createPeasant(200, 150),
  createPeasant(300, 100)
];

const building = {
  image: new Image(),
  x: 400,
  y: 300,
  width: 122,
  height: 107
};
building.image.src = 'human_citycenter.png';

function createPeasant(x, y) {
  return {
    x,
    y,
    target: null,
    speed: 1.5,
    selected: false,
    frame: 0,
    frameTimer: 0,
    frameInterval: 10,
    directionIndex: 0,
    mirrored: false
  };
}

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
          // Toggle selection if shift is held
          peasant.selected = !peasant.selected;
        } else {
          // Normal click: clear others and select only this
          peasants.forEach(p => p.selected = false);
          peasant.selected = true;
        }
      }
    });

    // If clicked empty space without shift, deselect all
    if (!found && !e.shiftKey) {
      peasants.forEach(p => p.selected = false);
    }
  }
});

// Right-click: move selected peasant(s)
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const mouse = getMousePos(e);
  peasants.forEach(peasant => {
    if (peasant.selected) {
      peasant.target = { x: mouse.x, y: mouse.y };
    }
  });
});

function update() {
  peasants.forEach(peasant => {
    if (peasant.target) {
      const dx = peasant.target.x - peasant.x;
      const dy = peasant.target.y - peasant.y;
      const dist = Math.hypot(dx, dy);

      if (dist > peasant.speed) {
        const angle = Math.atan2(dy, dx);
        const dir = getDirectionIndex(angle);
        peasant.directionIndex = dir.index;
        peasant.mirrored = dir.mirrored;

        const nextX = peasant.x + (dx / dist) * peasant.speed;
        const nextY = peasant.y + (dy / dist) * peasant.speed;

        if (isInsideBuilding(nextX, nextY)) {
        // Naive detour: just step sideways slightly (e.g., perpendicular to movement)
        const angle = Math.atan2(dy, dx);
        const detourAngle = angle + Math.PI / 2; // 90 degrees
        peasant.x += Math.cos(detourAngle) * peasant.speed;
        peasant.y += Math.sin(detourAngle) * peasant.speed;
        return; // skip frame advancement
        }

        peasant.x += (dx / dist) * peasant.speed;
        peasant.y += (dy / dist) * peasant.speed;

        peasant.frameTimer++;
        if (peasant.frameTimer >= peasant.frameInterval) {
          peasant.frame = (peasant.frame + 1) % FRAMES;
          peasant.frameTimer = 0;
        }
      } else {
        peasant.target = null;
        peasant.frame = 0;
      }
    }
  });
}

function getDirectionIndex(angle) {
  const deg = angle * (180 / Math.PI);
  if (deg >= -22.5 && deg < 22.5) return { index: 2, mirrored: false };     // Right
  if (deg >= 22.5 && deg < 67.5) return { index: 3, mirrored: false };      // Down-Right
  if (deg >= 67.5 && deg < 112.5) return { index: 4, mirrored: false };     // Down
  if (deg >= 112.5 && deg < 157.5) return { index: 3, mirrored: true };     // Down-Left
  if (deg >= 157.5 || deg < -157.5) return { index: 2, mirrored: true };    // Left
  if (deg >= -157.5 && deg < -112.5) return { index: 1, mirrored: true };   // Up-Left
  if (deg >= -112.5 && deg < -67.5) return { index: 0, mirrored: false };   // Up
  if (deg >= -67.5 && deg < -22.5) return { index: 1, mirrored: false };    // Up-Right
  return { index: 2, mirrored: false };
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
    ctx.drawImage(sprite, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, -FRAME_WIDTH / 2, 0, FRAME_WIDTH, FRAME_HEIGHT);
  } else {
    ctx.drawImage(sprite, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, dx - FRAME_WIDTH / 2, dy - FRAME_HEIGHT / 2, FRAME_WIDTH, FRAME_HEIGHT);
  }
  ctx.restore();

  if (p.selected) {
    ctx.beginPath();
    ctx.arc(p.x, p.y + 10, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'yellow';
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
        building.image,
        building.x - building.width / 2,
        building.y - building.height / 2,
        building.width,
        building.height
    );
  peasants.forEach(drawPeasant);
}

function isInsideBuilding(x, y) {
  return (
    x > building.x - building.width / 2 &&
    x < building.x + building.width / 2 &&
    y > building.y - building.height / 2 &&
    y < building.y + building.height / 2
  );
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
