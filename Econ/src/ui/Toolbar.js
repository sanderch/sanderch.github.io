// Minimal build toolbar. Selects the active tool and shows a live object count.
// Future buildings/vehicles get buttons here driven by definition registries.
export class Toolbar {
  constructor({ bus, world, picker }) {
    this.picker = picker;

    const bar = document.createElement('div');
    bar.id = 'toolbar';
    bar.innerHTML = `
      <button class="tool" data-tool="plant"><span class="ic">🌲</span><span>Plant tree</span></button>
      <button class="tool" data-tool="remove"><span class="ic">⛏️</span><span>Remove</span></button>
      <button class="tool" data-tool=""><span class="ic">🖱️</span><span>Cursor</span></button>
      <div class="count">Trees <b id="treeCount">0</b></div>`;
    document.body.appendChild(bar);

    this.buttons = [...bar.querySelectorAll('.tool')];
    this.buttons.forEach((b) => (b.onclick = () => this.select(b.dataset.tool || null)));
    const countEl = bar.querySelector('#treeCount');

    const update = () => (countEl.textContent = world.count('tree'));
    bus.on('object:added', update);
    bus.on('object:removed', update);
    update();

    addEventListener('keydown', (e) => { if (e.key === 'Escape') this.select(null); });
  }

  select(tool) {
    this.picker.setTool(tool);
    this.buttons.forEach((b) => b.classList.toggle('active', (b.dataset.tool || null) === tool));
  }
}
