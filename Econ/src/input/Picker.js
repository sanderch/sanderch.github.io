// Routes left-clicks to the handler for the active tool, distinguishing a click
// from an orbit-drag. Tool handlers (registered by the composition root) do the
// actual raycast and issue World commands, keeping input generic.
export class Picker {
  constructor(engine) {
    this.engine = engine;
    this.tool = null;
    this._handlers = {};

    const el = engine.renderer.domElement;
    let downX = 0, downY = 0, valid = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      downX = e.clientX; downY = e.clientY; valid = true;
    });
    el.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || !valid) return;
      valid = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // was an orbit drag
      this._handlers[this.tool]?.(e);
    });
  }

  setTool(tool) { this.tool = tool; }
  on(tool, fn) { this._handlers[tool] = fn; return this; }
}
