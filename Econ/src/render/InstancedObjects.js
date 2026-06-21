import * as THREE from 'three';

// A generic instanced-mesh pool: one draw call for many objects of the same
// kind. Instances are packed (swap-remove keeps the active range contiguous) and
// an instanceId<->entityId map enables picking. This is the rendering primitive
// that scales to thousands/millions of trees, units and props.
export class InstancedObjects {
  constructor(geometry, material, capacity = 100000) {
    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;        // many small instances; cull per-chunk later

    this.capacity = capacity;
    this.count = 0;
    this.idToSlot = new Map();
    this.slotToId = [];

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._color = new THREE.Color();
  }

  add(id, { x = 0, y = 0, z = 0, rotY = 0, scale = 1, tint = 1 }) {
    if (this.count >= this.capacity) return;
    const slot = this.count++;
    this._p.set(x, y, z);
    this._q.setFromAxisAngle({ x: 0, y: 1, z: 0 }, rotY);
    this._s.setScalar(scale);
    this._m.compose(this._p, this._q, this._s);
    this.mesh.setMatrixAt(slot, this._m);
    this.mesh.setColorAt(slot, this._color.setScalar(tint));
    this.idToSlot.set(id, slot);
    this.slotToId[slot] = id;
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  remove(id) {
    const slot = this.idToSlot.get(id);
    if (slot === undefined) return;
    const last = this.count - 1;
    if (slot !== last) {
      // move the last instance into the freed slot to stay packed
      this.mesh.getMatrixAt(last, this._m);
      this.mesh.setMatrixAt(slot, this._m);
      if (this.mesh.instanceColor) {
        this.mesh.getColorAt(last, this._color);
        this.mesh.setColorAt(slot, this._color);
      }
      const movedId = this.slotToId[last];
      this.slotToId[slot] = movedId;
      this.idToSlot.set(movedId, slot);
    }
    this.idToSlot.delete(id);
    this.slotToId.length = last;
    this.count = last;
    this.mesh.count = last;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  // Map a raycast hit on this mesh back to the entity id it represents.
  idAt(intersection) {
    if (intersection?.instanceId === undefined) return null;
    return this.slotToId[intersection.instanceId] ?? null;
  }
}
