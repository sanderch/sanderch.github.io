# Economy Game — Architecture & Design

> Status: foundation. The original single-file prototype now lives in `poc/`.
> The new application under `src/` is being built to this design. Only the
> **map + tree objects** slice is implemented so far; everything else below is
> the agreed target architecture, not yet code.

---

## 1. Goals

Build a real-time strategy / economy game that can scale to:

- **Huge maps** — far larger than fits in memory naively; streamed in chunks.
- **Thousands of buildings**, each with its own inventory and production.
- **Millions of units / objects** (trees, vehicles, items) rendered and simulated efficiently.
- **A deep economy** — many resource types, recipes, logistics, and (later) markets.

To get there the codebase must be **data-driven, layered, and data-oriented**, with
simulation, rendering, and UI cleanly separated.

### Non-goals (for now)
Multiplayer netcode, audio, modding API, and a full build toolchain. The design
leaves room for them but we don't build them yet.

---

## 2. Guiding principles

1. **Separate the three layers.** Simulation (the truth) ⟂ Rendering (a view of
   the truth) ⟂ UI (another view + commands). They communicate through an
   **event bus** and **command queue**, never by reaching into each other.
2. **Data-oriented.** Game content (resources, buildings, recipes, object kinds)
   is **plain data** registered in registries — not bespoke functions. Adding a
   building should mean adding a definition, not writing a new `makeX()`.
3. **Entities are generic.** Trees, buildings, vehicles, and items are all
   `GameObject`s composed of **components**. Behaviour comes from **systems**
   that iterate components, not from per-type methods.
4. **Determinism.** A fixed-timestep simulation with a seeded RNG so the same
   inputs produce the same world — required for save/load, replays, and (future)
   multiplayer.
5. **Scale by structure, not by hardware.** Instanced rendering, chunked world,
   spatial indexing, LOD, frustum culling, object pooling, and render-on-demand
   are first-class, not afterthoughts.

---

## 3. Layered architecture

```
        ┌──────────────────────────────────────────────┐
        │                     UI                        │  data-driven panels,
        │  (renders from model + emits Commands)        │  toolbars, HUD
        └───────────────▲───────────────┬───────────────┘
                        │ events        │ commands
        ┌───────────────┴───────────────▼───────────────┐
        │                 SIMULATION                     │  the single source of truth
        │  World (entities+components) · Systems · Tick  │  fixed timestep, deterministic
        │  Registries (defs) · Economy · Pathfinding     │
        └───────────────┬───────────────────────────────┘
                        │ events / state reads
        ┌───────────────▼───────────────────────────────┐
        │                 RENDERING                      │  THREE.js scene
        │  SceneView syncs from model · InstancedMesh    │  instancing, LOD, culling,
        │  per object kind · Camera · render-on-demand   │  render only when dirty
        └────────────────────────────────────────────────┘
```

- **Input** (picking, tools, selection) turns user actions into **Commands**.
- **Commands** are validated and applied by the simulation (e.g. `PlaceObject`,
  `RemoveObject`, `SetVehicleRoute`). This keeps mutation in one place and makes
  undo/replay/networking possible.
- The simulation emits **events** (`object:added`, `inventory:changed`, …).
  Rendering and UI subscribe and update their views.

---

## 4. Project structure

```
/
  poc/                     Frozen single-file prototype (reference only)
  docs/ARCHITECTURE.md     This document
  index.html               New app entry (served, not file://)
  styles.css
  src/
    core/                  Engine-agnostic foundation
      Engine.js            renderer, camera, lights, env, render loop (render-on-demand)
      EventBus.js          tiny pub/sub
      Loop.js              (future) fixed-timestep accumulator driving systems
      rng.js               (future) seeded deterministic RNG
    world/                 The simulation / model
      World.js             entity store: add/remove/query GameObjects, emits events
      Terrain.js           map: chunked tiles, world↔tile conversion, raycast target
      Chunk.js             (future) a streamed square of the map
      SpatialIndex.js      (future) uniform grid / quadtree for neighbour queries
    ecs/                   (future) component definitions + systems
      components/          Transform, Inventory, Producer, Mover, RoadAccess, …
      systems/             ProductionSystem, TransportSystem, PowerSystem, …
    defs/                  (future) data-driven content registries
      resources.js         resource types
      buildings.js         building definitions (footprint, recipes, storage)
      recipes.js           input→output→time
      objects.js           non-building object kinds (tree, rock, …)
    economy/               (future) inventories, recipes runtime, logistics, markets
    render/                The view layer
      Sky.js               procedural sky + image-based lighting environment
      textures.js          procedural materials (ground, bark, foliage, …)
      InstancedObjects.js  generic InstancedMesh pool with add/remove + picking
      SceneView.js         (future) subscribes to model events, owns all renderers
      lod.js               (future) level-of-detail selection
    objects/               Per-kind view+data factories
      tree.js              tree geometry/material + per-instance data
    input/
      Picker.js            raycasting, tool state → Commands
      Selection.js         (future) click-to-select entities
    ui/
      Toolbar.js           build/tool toolbar
      panels/              (future) data-driven inspector panels per definition
    persistence/           (future) serialize/deserialize the World
    main.js                composition root — wires the layers together
```

Folders marked **(future)** are intentionally empty for now; they mark where
each concern will live so growth doesn't require reshuffling.

---

## 5. Core concepts

### 5.1 GameObject + Components
An entity is an `id` plus a bag of **components** (plain data):

```
GameObject {
  id, kind                 // 'tree' | 'building' | 'vehicle' | 'item' ...
  // components, e.g.
  transform: { x, y, z, rotY, scale }
  inventory: { slots: Map<resourceId, qty>, capacity }
  producer:  { recipeId, progress }
  mover:     { speed, path, waypoint }
  roadAccess:{ tile }
}
```

A **tree** is the minimal case: just `kind:'tree'` + a transform (+ a tint for
variation). A **factory** is the same machinery with `inventory` + `producer`
components. This is why trees, buildings, and units share one store and one set
of generic operations.

### 5.2 World (the model)
`World` owns all `GameObject`s in a `Map<id, obj>` and emits `object:added` /
`object:removed` / `object:changed`. It knows **nothing** about THREE.js or the
DOM. Spatial queries go through a `SpatialIndex` (uniform grid keyed by tile) so
"what's near here?" stays O(1)-ish at scale.

### 5.3 Registries & definitions
Content is declared as data and registered once at boot:

```
resources.register({ id:'fabric', name:'Fabric', color:'#eef2f7', … })
buildings.register({ id:'fabric_factory', footprint:[3,3], storage:48,
                     recipe:'weave_fabric', model:'factory' })
recipes.register({ id:'weave_fabric', in:{cotton:2,dye:1,power:5}, out:{fabric:1}, time:1.5 })
objects.register({ id:'tree', model:'tree', removable:true })
```

Systems and UI read these registries. Adding a new building/resource/unit is a
data change, not a code change — the key to "thousands of buildings".

### 5.4 Systems & the tick
The simulation advances on a **fixed timestep** (e.g. 20 Hz). Each tick runs an
ordered list of systems, each iterating the components it cares about:

```
ProductionSystem  — advance recipes, consume inputs, emit outputs into inventories
TransportSystem   — move vehicles along road paths, load/unload
PowerSystem, …    — future
```

Rendering interpolates between the last two simulation states for smoothness and
runs at display rate, **decoupled** from the tick. (The current slice has no
moving simulation yet, so it renders on demand only.)

### 5.5 Map / Terrain
The world is a grid of tiles grouped into **chunks**. Only chunks near the camera
are meshed and kept resident; distant chunks are streamed out. `Terrain` exposes
`worldToTile` / `tileToWorld` and a raycast surface for placement. Pathfinding at
scale uses **hierarchical / flow-field** approaches over the tile/chunk graph
rather than per-unit BFS.

---

## 6. Rendering strategy (how we hit "millions")

- **Instanced rendering.** Every repeated object kind (trees, units, props) is
  drawn with one `InstancedMesh` → one draw call for thousands of instances.
  `InstancedObjects` manages a packed instance pool with **swap-remove** so the
  active range stays compact, plus `instanceId → entityId` mapping for picking.
- **Chunked instancing + frustum culling.** Per-chunk instanced meshes so
  off-screen chunks cost nothing.
- **LOD & impostors.** Distant trees/units drop to billboards/lower meshes.
- **Render-on-demand.** Redraw only when the camera moves or the model changes;
  an idle scene costs ~0 GPU. (Implemented now.)
- **Static shadows** refreshed only when geometry changes. (Pattern proven in PoC.)
- **SoA / typed arrays** for hot unit data (positions, velocities) to stay
  cache-friendly and to enable moving the simulation into a **Web Worker** later.

---

## 7. Persistence
Because the model is plain data separated from views, **save = serialize the
World** (entities + components + RNG seed + registries version). Load rebuilds
the model and the views re-sync from `object:added` events. No view state needs
saving.

---

## 8. Performance budget & tactics (summary)

| Concern              | Tactic                                                        |
|----------------------|---------------------------------------------------------------|
| Many objects drawn   | InstancedMesh per kind, per chunk; LOD; frustum culling       |
| Many objects simulated | Systems over packed component arrays; fixed timestep        |
| Huge map             | Chunk streaming; spatial index; hierarchical pathfinding      |
| Idle cost            | Render-on-demand; static shadow maps                          |
| Main-thread stalls   | Move simulation to a Web Worker; transfer typed arrays        |
| GC pressure          | Object pooling; reuse Matrix4/Vector3 scratch objects         |

---

## 9. Conventions

- **No build step yet.** Native ES modules, THREE via import-map CDN. Because
  browsers block ES-module imports over `file://`, **serve the folder**:
  `python3 -m http.server` then open `http://localhost:8000`.
- **Recommended upgrade** (when the project grows): **Vite + TypeScript** for
  bundling, types, and HMR. The module layout above maps 1:1 onto a Vite `src/`.
- **Layer discipline:** `world/` and `ecs/` must not import from `render/`,
  `input/`, or `ui/`. Views depend on the model, never the reverse.
- **Naming:** definitions are nouns (`fabric_factory`), systems are `XxxSystem`,
  events are `domain:verb` (`object:added`).
- **Smoke test:** `bash tests/run.sh` serves the app, loads it in headless
  Chrome (puppeteer-core), and fails on any console/page error while checking
  the scene + toolbar render and Plant adds a tree. Run it after UI changes.

---

## 10. Current slice (implemented)

The first vertical slice exercises the spine of the architecture end-to-end:

- `core/Engine.js` — realistic renderer (ACES tone mapping, sRGB, soft shadows),
  sky-based image lighting, OrbitControls with damping, render-on-demand loop.
- `world/World.js` — generic object store with add/remove + events.
- `world/Terrain.js` — procedurally heightmapped terrain (hills, mountains,
  valleys) with elevation/slope colouring (sand→grass→rock→snow) and a water
  plane at sea level; exposes `heightAt`, tile conversion, raycast surface.
- `render/InstancedObjects.js` — generic instanced pool (add/remove/pick).
- `objects/tree.js` — tree geometry/material + per-instance variation.
- `input/Picker.js` — Plant / Remove tools turning clicks into World commands.
- `ui/Toolbar.js` — tool selection + live object count.

A **tree** is already a first-class `GameObject` with coordinates that can be
added and removed; buildings, vehicles, and the economy will be added the same
way — as definitions + components + systems — without changing this spine.

---

## 11. Roadmap

1. **(done)** Engine + World + Terrain + instanced trees (add/remove).
2. Definitions/registries + `Inventory` component + resource types.
3. `BuildingDef`s + generic placement + `ProductionSystem` (port the factory).
4. Selection + data-driven inspector panels.
5. `TransportSystem` + road graph (port vehicles).
6. Chunk streaming + spatial index + LOD.
7. Fixed-timestep tick in a Web Worker; save/load.
