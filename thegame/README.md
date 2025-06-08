# Mini RTS Game

This project is a browser-based real-time strategy (RTS) game prototype. It features:

- Grid-based map with buildings and peasant units
- Unit selection (single and drag-select)
- Right-click movement with A* pathfinding
- Animated sprites and obstacle avoidance

## Structure

- `index.html` – Main HTML file
- `js/` – JavaScript source code, now modularized:
  - `config.js` – Game configuration constants
  - `characterTypes.js` – Character type definitions
  - `sprites.js` – Sprite/image loading
  - `entities.js` – Entity creation and management
  - `input.js` – Input handling
  - `pathfinding.js` – Pathfinding and grid helpers
  - `direction.js` – Direction/animation utilities
  - `render.js` – Rendering functions
  - `game.js` – Main game loop and glue code
- `img/` – Image assets

## How to Run

Open `index.html` in your browser. Make sure to use a local server or enable CORS if you encounter image loading issues.

## Future Extensions
- Add more unit/building types
- Implement resources, combat, and UI improvements
- Add sound effects and music
- Improve AI and pathfinding
- Add save/load functionality
