// The model / simulation store. Owns every GameObject as plain data and emits
// events when objects appear or disappear. It knows nothing about THREE.js or
// the DOM — rendering and UI subscribe to it. This is the spine that buildings,
// vehicles and items will plug into exactly the way trees do today.
export class World {
  constructor(bus) {
    this.bus = bus;
    this.objects = new Map();    // id -> GameObject
    this._nextId = 1;
  }

  // Create a GameObject of `kind` with arbitrary component props (transform, …).
  add(kind, props = {}) {
    const id = this._nextId++;
    const obj = { id, kind, ...props };
    this.objects.set(id, obj);
    this.bus.emit('object:added', obj);
    return obj;
  }

  remove(id) {
    const obj = this.objects.get(id);
    if (!obj) return false;
    this.objects.delete(id);
    this.bus.emit('object:removed', obj);
    return true;
  }

  get(id) { return this.objects.get(id); }

  *ofKind(kind) {
    for (const obj of this.objects.values()) if (obj.kind === kind) yield obj;
  }

  count(kind) {
    if (!kind) return this.objects.size;
    let n = 0;
    for (const obj of this.objects.values()) if (obj.kind === kind) n++;
    return n;
  }
}
