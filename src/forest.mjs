// Decorative geometry only. The caller must omit this module's scenery in
// benchmark scenes. No gameplay entities, collision, or Game RNG are touched.
function randomFromSeed(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, state | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const LAMPS = {
  1: [[0, 25], [23.8, 7.7], [14.7, -20.2], [-14.7, -20.2], [-23.8, 7.7]],
  2: [[0, 20], [17, -10], [-17, -10], [70, 20], [87, -10], [53, -10]],
  3: [[0, 6], [18, 10], [-18, 10], [35, -10], [-35, -10], [20, -35], [-20, -35]]
};

function segmentDistance(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / Math.max(1e-9, dx * dx + dz * dz)));
  return Math.hypot(x - ax - t * dx, z - az - t * dz);
}

/**
 * Add a seeded, instanced fairy-tale forest to a supplied Three.js group.
 * groundHeight(x,z) should return the actual terrain Y, or -Infinity off-island.
 * Returns a THREE.Group with userData.counts for inspection.
 */
export function addForest({ THREE, parent, night = 1, groundHeight = () => 0, seed = 2026 }) {
  if (!THREE || !parent?.add) throw new TypeError('addForest requires THREE and a parent Group');
  const random = randomFromSeed(seed ^ Math.imul(night, 0x45D9F3B));
  const group = new THREE.Group();
  group.name = 'forest-decoration';
  group.userData.decorationOnly = true;
  group.userData.excludeFromBenchmark = true;
  group.userData.seed = seed;
  const counts = { trees: 0, rocks: 0, ferns: 0, mushrooms: 0, logs: 0, drawCalls: 0 };
  group.userData.counts = counts;

  const geometry = {
    wood: new THREE.CylinderGeometry(.72, 1, 1, 7),
    leaves: new THREE.IcosahedronGeometry(1, 1),
    pine: new THREE.ConeGeometry(1, 1, 9),
    rock: new THREE.DodecahedronGeometry(1, 0),
    leaf: new THREE.PlaneGeometry(1, 1),
    stem: new THREE.CylinderGeometry(1, 1, 1, 5),
    cap: new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    log: new THREE.CylinderGeometry(1, 1, 1, 9),
    cut: new THREE.CircleGeometry(1, 9)
  };
  const material = {
    wood: new THREE.MeshStandardMaterial({ color: '#705744', roughness: 1 }),
    leaves: new THREE.MeshStandardMaterial({ color: '#3d7860', roughness: .95 }),
    pine: new THREE.MeshStandardMaterial({ color: '#2a655b', roughness: 1 }),
    rock: new THREE.MeshStandardMaterial({ color: '#71847e', roughness: 1 }),
    moss: new THREE.MeshStandardMaterial({ color: '#64875b', roughness: 1 }),
    fern: new THREE.MeshStandardMaterial({ color: '#6ca276', roughness: 1, side: THREE.DoubleSide }),
    stem: new THREE.MeshStandardMaterial({ color: '#d9cbac', roughness: 1 }),
    cap: new THREE.MeshStandardMaterial({ color: '#e5aa6a', emissive: '#b06b30', emissiveIntensity: .17, roughness: .8 }),
    cut: new THREE.MeshStandardMaterial({ color: '#b89a6d', roughness: 1, side: THREE.DoubleSide })
  };
  const batches = new Map();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), direction = new THREE.Vector3();
  const euler = new THREE.Euler();
  function add(kind, geometryKey, materialKey, pos, size, rotation = [0, 0, 0], color) {
    let batch = batches.get(kind);
    if (!batch) { batch = { geometry: geometry[geometryKey], material: material[materialKey], matrices: [], colors: [] }; batches.set(kind, batch); }
    position.set(...pos); scale.set(...size); quaternion.setFromEuler(euler.set(...rotation));
    matrix.compose(position, quaternion, scale);
    batch.matrices.push(matrix.clone()); batch.colors.push(color ?? '#ffffff');
  }
  function woodBetween(a, b, radius, color) {
    position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    direction.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    scale.set(radius, direction.length(), radius);
    quaternion.setFromUnitVectors(up, direction.normalize()); matrix.compose(position, quaternion, scale);
    let batch = batches.get('wood');
    if (!batch) { batch = { geometry: geometry.wood, material: material.wood, matrices: [], colors: [] }; batches.set('wood', batch); }
    batch.matrices.push(matrix.clone()); batch.colors.push(color ?? '#ffffff');
  }

  const centers = night === 2 ? [[0, 0, 28], [70, 0, 28]] : [[0, 0, night === 3 ? 45 : 40]];
  const lamps = LAMPS[night] ?? LAMPS[1];
  const pads = night === 2 ? [[20, 18], [50, -18], [35, 0]] : night === 3 ? [[0, 13], [30, 25], [-30, 25]] : [];
  const occupied = [];
  function pick(clearance, tree = false) {
    for (let tries = 0; tries < 350; tries++) {
      const c = centers[Math.floor(random() * centers.length)];
      const angle = random() * Math.PI * 2;
      const minimum = tree ? c[2] * .4 : 5;
      const radius = Math.sqrt(random() * ((c[2] - 3) ** 2 - minimum ** 2) + minimum ** 2);
      const x = c[0] + Math.cos(angle) * radius, z = c[1] + Math.sin(angle) * radius;
      if (Math.hypot(x, z) < (tree ? 10 : 5)) continue;
      if (lamps.some(l => Math.hypot(x - l[0], z - l[1]) < (tree ? 4.8 : 2.8))) continue;
      if (pads.some(p => Math.hypot(x - p[0], z - p[1]) < 4)) continue;
      if (night === 2 && x > 20 && x < 50 && Math.abs(z) < 4) continue;
      if (tree && lamps.some(l => segmentDistance(x, z, c[0], c[1], l[0], l[1]) < 2.5)) continue;
      if (occupied.some(p => Math.hypot(x - p[0], z - p[1]) < clearance)) continue;
      const y = groundHeight(x, z);
      if (!Number.isFinite(y)) continue;
      // Keep large props off cliffs/tier edges rather than letting them float.
      if (tree && [[1.3, 0], [-1.3, 0], [0, 1.3], [0, -1.3]].some(([dx, dz]) => Math.abs(groundHeight(x + dx, z + dz) - y) > .6)) continue;
      occupied.push([x, z]); return [x, y, z];
    }
    return null;
  }

  for (let i = 0; i < 70; i++) {
    const point = pick(2.5, true); if (!point) continue;
    const [x, y, z] = point, height = 3.2 + random() * 2.9, radius = .19 + random() * .13;
    const bend = (random() - .5) * .6, angle = random() * Math.PI * 2;
    woodBetween([x, y, z], [x + bend, y + height, z], radius, '#d1b99b');
    for (let root = 0; root < 2; root++) {
      const a = angle + root * Math.PI;
      woodBetween([x + Math.cos(a) * .8, y + .05, z + Math.sin(a) * .8], [x, y + .7, z], radius * .6, '#b1a184');
    }
    if (i % 3 === 0) {
      for (let tier = 0; tier < 3; tier++) add('pine', 'pine', 'pine', [x + bend, y + height * .72 + tier * .8, z], [1.8 - tier * .35, 2.8 - tier * .35, 1.8 - tier * .35], [0, angle, 0], tier % 2 ? '#b6d3b4' : '#82af9a');
    } else {
      for (let branch = 0; branch < 3; branch++) {
        const a = angle + branch * Math.PI * 2 / 3;
        const bx = x + bend + Math.cos(a) * .95, bz = z + Math.sin(a) * .95;
        woodBetween([x + bend * .6, y + height * .6, z], [bx, y + height * .95, bz], radius * .5, '#d3b98d');
        const s = 1.4 + random() * .55;
        add('leaves', 'leaves', 'leaves', [bx, y + height + (branch === 0 ? .5 : 0), bz], [s, s * .76, s], [random(), angle, random() * .2], ['#a6c59a', '#78a78d', '#bed1a1'][i % 3]);
      }
    }
    counts.trees++;
  }

  for (let i = 0; i < 60; i++) {
    const p = pick(1.15); if (!p) continue;
    const r = .35 + random() * .8, rotation = [random() * .3, random() * 6.28, random() * .25];
    add('rocks', 'rock', 'rock', [p[0], p[1] + r * .25, p[2]], [r * 1.2, r * .65, r], rotation, i % 2 ? '#bfcbc5' : '#8faaa4');
    if (i % 3 !== 0) add('moss', 'rock', 'moss', [p[0] + r * .12, p[1] + r * .53, p[2]], [r * .9, r * .12, r * .75], rotation, '#b4c494');
    counts.rocks++;
  }

  for (let i = 0; i < 45; i++) {
    const p = pick(.6); if (!p) continue;
    const angle = random() * 6.28;
    for (let leaf = 0; leaf < 7; leaf++) {
      const a = angle + leaf * Math.PI * 2 / 7, length = .55 + random() * .45;
      add('fern', 'leaf', 'fern', [p[0] + Math.cos(a) * length * .3, p[1] + .16 + length * .12, p[2] + Math.sin(a) * length * .3], [length, .18, 1], [-Math.PI / 2 + .35, 0, a], leaf % 2 ? '#c1d9ad' : '#7fb88a');
    }
    counts.ferns++;
  }

  for (let i = 0; i < 24; i++) {
    const p = pick(.3); if (!p) continue;
    const r = .1 + random() * .1, height = .18 + random() * .17;
    add('mushroom-stems', 'stem', 'stem', [p[0], p[1] + height / 2, p[2]], [.035, height, .035]);
    add('mushroom-caps', 'cap', 'cap', [p[0], p[1] + height, p[2]], [r * 1.4, r * .7, r * 1.4], [0, random() * 6.28, 0], i % 2 ? '#fff0cc' : '#e4b383');
    counts.mushrooms++;
  }

  for (let i = 0; i < 7; i++) {
    const p = pick(2); if (!p) continue;
    const angle = random() * Math.PI * 2, length = 1.6 + random() * 1.3, radius = .18 + random() * .13;
    add('logs', 'log', 'wood', [p[0], p[1] + radius, p[2]], [radius, length, radius], [Math.PI / 2, 0, angle]);
    // Pale end grain gives fallen trunks a readable shape without a texture.
    const dx = -Math.sin(angle), dz = Math.cos(angle);
    for (const sign of [-1, 1]) add('cut-ends', 'cut', 'cut', [p[0] + dx * length * .501 * sign, p[1] + radius, p[2] + dz * length * .501 * sign], [radius * .82, radius * .82, 1], [0, Math.atan2(dx * sign, dz * sign), 0]);
    counts.logs++;
  }

  const color = new THREE.Color();
  for (const [name, batch] of batches) {
    if (!batch.matrices.length) continue;
    const instances = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
    instances.name = `forest-${name}`;
    instances.castShadow = !['fern', 'moss', 'mushroom-stems', 'mushroom-caps'].includes(name);
    instances.receiveShadow = true;
    batch.matrices.forEach((m, i) => { instances.setMatrixAt(i, m); instances.setColorAt(i, color.set(batch.colors[i])); });
    instances.instanceMatrix.needsUpdate = true;
    instances.computeBoundingSphere();
    group.add(instances); counts.drawCalls++;
  }
  parent.add(group);
  return group;
}

/** Dispose only resources owned by addForest; call before rebuilding a night. */
export function disposeForest(group) {
  if (!group) return;
  const geometries = new Set(), materials = new Set();
  group.traverse(child => {
    if (child.geometry) geometries.add(child.geometry);
    for (const item of Array.isArray(child.material) ? child.material : [child.material]) if (item) materials.add(item);
    if (child.isInstancedMesh) child.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  group.removeFromParent();
  group.clear();
}
