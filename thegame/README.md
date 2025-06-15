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
- `tests/` – Automated test files

## How to Run

Open `index.html` in your browser. Make sure to use a local server or enable CORS if you encounter image loading issues.

## How to Run Tests

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Install dependencies (only needed once):
   ```bash
   npm install
   ```
3. Run the test suite:
   ```bash
   npm test
   ```

This will run all tests in the `tests/` directory using Jest. The test environment is configured to work with ES modules and browser-like globals.

## Future Extensions
- Add more unit/building types
- Implement resources, combat, and UI improvements
- Add sound effects and music
- Improve AI and pathfinding
- Add save/load functionality
