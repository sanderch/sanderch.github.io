import { EventBus } from './core/EventBus.js';
import { Engine } from './core/Engine.js';
import { World } from './world/World.js';
import { Terrain } from './world/Terrain.js';
import { createForest, treeData } from './objects/tree.js';
import { Picker } from './input/Picker.js';
import { Toolbar } from './ui/Toolbar.js';

// --- composition root: wire the layers together (no game logic lives here) ---
const bus = new EventBus();
const engine = new Engine(document.getElementById('app'));
const world = new World(bus);

const terrain = new Terrain({ size: 400, tileSize: 2 });
engine.scene.add(terrain.group);
engine.setMapBounds(terrain.size / 2);   // never pan the view off the map

const forest = createForest();
engine.scene.add(forest.mesh);

// model -> view: keep the instanced forest in sync with tree GameObjects
bus.on('object:added', (o) => {
  if (o.kind !== 'tree') return;
  forest.add(o.id, { ...o.transform, rotY: o.rotY, scale: o.scale, tint: o.tint });
  engine.refreshShadows();
});
bus.on('object:removed', (o) => {
  if (o.kind !== 'tree') return;
  forest.remove(o.id);
  engine.refreshShadows();
});

// input tools -> World commands
const picker = new Picker(engine);
picker.on('plant', (e) => {
  const hit = engine.pick(e, [terrain.surface])[0];
  if (!hit) return;
  const { x, z } = terrain.snap(hit.point.x, hit.point.z);
  const y = terrain.heightAt(x, z);
  if (y <= terrain.waterLevel + 0.2) return;       // no trees in the water
  world.add('tree', treeData(x, z, y));
});
picker.on('remove', (e) => {
  const id = forest.idAt(engine.pick(e, [forest.mesh])[0]);
  if (id != null) world.remove(id);
});

new Toolbar({ bus, world, picker });

// seed the dry land with trees (skip water and steep peaks)
const half = terrain.size / 2 - 16;
let placed = 0, tries = 0;
while (placed < 60 && tries < 1200) {
  tries++;
  const p = terrain.snap((Math.random() * 2 - 1) * half, (Math.random() * 2 - 1) * half);
  const y = terrain.heightAt(p.x, p.z);
  if (y > terrain.waterLevel + 0.8 && y < terrain.snowLevel) {
    world.add('tree', treeData(p.x, p.z, y));
    placed++;
  }
}

engine.refreshShadows();
engine.start();

// debug/test hook
window.app = { engine, world, terrain, forest, bus };
