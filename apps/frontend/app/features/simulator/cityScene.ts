import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const districtLocations: Record<string, [number, number, number]> = {
  Есиль: [10, 10, -23], Алматы: [23, 14, -4], Сарыарка: [-36, 7, -17],
  Байконур: [-33, 6, 28], Нура: [5, 8, 28],
};

export const createCityScene = (host: HTMLDivElement, markers: Map<string, HTMLButtonElement>) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a0b9c1');
  const camera = new THREE.OrthographicCamera(-65, 65, 45, -45, 1, 400);
  camera.position.set(35, 85, 115);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.minZoom = .8;
  controls.maxZoom = 2.1;
  controls.minPolarAngle = .25;
  controls.maxPolarAngle = 1.05;
  controls.update();
  scene.add(new THREE.HemisphereLight('#d8efff', '#53683c', 1.5));
  const sun = new THREE.DirectionalLight('#fff0ce', 3.1);
  sun.position.set(-45, 85, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, far: 230 });
  sun.shadow.normalBias = .3;
  scene.add(sun);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  geometries.push(boxGeometry);
  const material = (color: string, metalness = 0) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: .65, metalness });
    materials.push(value);
    return value;
  };
  const grass = material('#65834a');
  const pavement = material('#d7c9af');
  const road = material('#515c60');
  const white = material('#eee2ca');
  const gold = material('#dfb440', .65);
  const glass = material('#49879d', .45);
  const roof = material('#857e71');
  const brick = material('#a56547');
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(boxGeometry, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = h > 1; mesh.receiveShadow = true; scene.add(mesh);
    return mesh;
  };
  box(0, -1.1, 0, 190, 2, 160, grass);
  const riverZ = (x: number) => 4 + Math.sin(x * .055) * 14;
  const river = (width: number, y: number, color: string) => {
    const points: number[] = [];
    for (let x = -96; x < 96; x += 2) {
      const z = riverZ(x); const next = riverZ(x + 2);
      points.push(x, y, z - width, x, y, z + width, x + 2, y, next - width,
        x + 2, y, next - width, x, y, z + width, x + 2, y, next + width);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.computeVertexNormals(); geometries.push(geometry);
    const mat = material(color); mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geometry, mat); mesh.receiveShadow = true; scene.add(mesh);
  };
  river(9, .01, '#b7b58d');
  river(7.5, .04, '#e0cfaa');
  river(6.2, .07, '#24596f');

  for (const x of [-60, -30, 0, 30, 60]) {
    box(x, .13, 0, 3.2, .2, 150, road);
    box(x, .26, riverZ(x), 4, .45, 25, pavement);
    box(x, .52, riverZ(x), 2.7, .1, 25, road);
    for (const side of [-1, 1]) {
      box(x + side * 1.8, .95, riverZ(x), .16, .6, 25, white);
      const points = Array.from({ length: 25 }, (_, i) => new THREE.Vector3(
        x + side * 1.6, 1 + Math.sin(i / 24 * Math.PI) * 4, riverZ(x) - 10 + i / 24 * 20,
      ));
      const archGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, .12, 5, false);
      geometries.push(archGeometry);
      scene.add(new THREE.Mesh(archGeometry, white));
      for (let i = 2; i < 23; i += 3) {
        const h = Math.sin(i / 24 * Math.PI) * 4;
        box(x + side * 1.6, 1 + h / 2, riverZ(x) - 10 + i / 24 * 20, .07, h, .07, white);
      }
    }
    for (let z = -70; z < 72; z += 4) box(x, .6, z, .08, .03, 1.8, white);
  }
  for (const z of [-58, -36, -16, 37, 59]) {
    box(0, .15, z, 185, .2, 2.7, road);
    for (let x = -88; x < 90; x += 5) box(x, .28, z, 2, .04, .08, white);
  }

  let seed = 17;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const buildings: { x: number; z: number; h: number; w: number; d: number; color: THREE.Color }[] = [];
  const colors = ['#e0ccac', '#c3c6c1', '#ae8971', '#e2dbca', '#bbc8cd', '#a5b5b5'];
  for (let x = -85; x <= 85; x += 6) {
    for (let z = -68; z <= 68; z += 6) {
      if (Math.abs(z - riverZ(x)) < 11 || Math.abs(x % 30) < 3.5
        || [-58, -36, -16, 37, 59].some((street) => Math.abs(z - street) < 4)
        || (Math.abs(x) < 14 && z < -12 && z > -48)
        || (Math.abs(x + 18) < 11 && Math.abs(z - 47) < 7)
        || (Math.abs(x - 23) < 11 && Math.abs(z + 49) < 11)
        || random() < .12) continue;
      const center = x > 10 && x < 42 && z < -19 && z > -52;
      buildings.push({ x, z, h: center ? 9 + random() * 18 : 2 + random() * (x < -25 ? 4 : 8),
        w: 2.8 + random() * 1.9, d: 2.8 + random() * 1.6,
        color: new THREE.Color(center && random() > .4 ? '#6595a6' : colors[Math.floor(random() * colors.length)]) });
    }
  }
  const buildingMaterial = material('#ffffff');
  const instances = new THREE.InstancedMesh(boxGeometry, buildingMaterial, buildings.length);
  instances.castShadow = true; instances.receiveShadow = true;
  const matrix = new THREE.Matrix4(); const quaternion = new THREE.Quaternion();
  const put = (mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, w: number, h: number, d: number) => {
    matrix.compose(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(w, h, d));
    mesh.setMatrixAt(index, matrix);
  };
  buildings.forEach((b, i) => { put(instances, i, b.x, b.h / 2, b.z, b.w, b.h, b.d); instances.setColorAt(i, b.color); });
  scene.add(instances);
  const roofs = new THREE.InstancedMesh(boxGeometry, roof, buildings.length);
  const equipment = new THREE.InstancedMesh(boxGeometry, pavement, buildings.length);
  buildings.forEach((b, i) => {
    put(roofs, i, b.x, b.h + .13, b.z, b.w + .15, .25, b.d + .15);
    put(equipment, i, b.x + .4, b.h + .45, b.z, b.w * .35, .6, b.d * .32);
  });
  scene.add(roofs, equipment);
  const pitchedGeometry = new THREE.ConeGeometry(1, 1, 4); pitchedGeometry.rotateY(Math.PI / 4);
  geometries.push(pitchedGeometry);
  const houses = buildings.filter((b) => b.h < 4.5);
  const pitchedRoofs = new THREE.InstancedMesh(pitchedGeometry, brick, houses.length);
  houses.forEach((b, i) => put(pitchedRoofs, i, b.x, b.h + .8, b.z, b.w * .8, 1.8, b.d * .8));
  pitchedRoofs.castShadow = true; scene.add(pitchedRoofs);
  const windows: [number, number, number, number, number, number][] = [];
  buildings.forEach((b) => {
    for (let y = 1.4; y < b.h - .3; y += 1.5) {
      for (let offset = -b.w / 2 + .5; offset < b.w / 2 - .2; offset += .8) {
        windows.push([b.x + offset, y, b.z + b.d / 2 + .02, .4, .65, .03],
          [b.x + offset, y, b.z - b.d / 2 - .02, .4, .65, .03]);
      }
      for (let offset = -b.d / 2 + .5; offset < b.d / 2 - .2; offset += .8) {
        windows.push([b.x + b.w / 2 + .02, y, b.z + offset, .03, .65, .4],
          [b.x - b.w / 2 - .02, y, b.z + offset, .03, .65, .4]);
      }
    }
  });
  const windowMesh = new THREE.InstancedMesh(boxGeometry, glass, windows.length);
  windows.forEach((v, i) => put(windowMesh, i, ...v)); scene.add(windowMesh);
  const treeGeometry = new THREE.IcosahedronGeometry(1, 1); geometries.push(treeGeometry);
  const treePositions: [number, number][] = [];
  for (let i = 0; i < 2400; i++) {
    const x = random() * 176 - 88; const z = random() * 136 - 68;
    if (Math.abs(z - riverZ(x)) < 8.5 || Math.abs(x % 30) < 3
      || [-58, -36, -16, 37, 59].some((street) => Math.abs(z - street) < 2)
      || buildings.some((b) => Math.abs(b.x - x) < 3 && Math.abs(b.z - z) < 3)
      || (Math.abs(x) < 6 && z < -12 && z > -48)
      || (Math.abs(x + 18) < 10 && Math.abs(z - 47) < 7)
      || (Math.abs(x - 23) < 9 && Math.abs(z + 49) < 9)) continue;
    treePositions.push([x, z]);
  }
  for (let x = -85; x < 86; x += 2.8) {
    if (Math.abs(x % 30) < 3) continue;
    treePositions.push([x, riverZ(x) - 9.5], [x, riverZ(x) + 9.5]);
  }
  const trees = new THREE.InstancedMesh(treeGeometry, material('#477037'), treePositions.length);
  treePositions.forEach(([x, z], i) => {
    const s = .65 + random() * .6; put(trees, i, x, s * 1.3, z, s, s * 1.5, s);
    trees.setColorAt(i, new THREE.Color().setHSL(.20 + random() * .08, .38, .65 + random() * .25));
  });
  trees.castShadow = true; scene.add(trees);

  const cylinder = (r1: number, r2: number, h: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const geo = new THREE.CylinderGeometry(r1, r2, h, 24); geometries.push(geo);
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true; scene.add(mesh); return mesh;
  };
  box(0, .15, -29, 10, .2, 35, pavement);
  for (const x of [-9, 9]) {
    box(x, .12, -30, 3.5, .2, 31, pavement);
    for (let z = -44; z < -13; z += 4) {
      cylinder(1.2, 1.2, .3, x, .35, z, grass);
    }
  }
  cylinder(6, 6, .3, 0, .3, -25, pavement);
  cylinder(1, 1.5, 18, 0, 9.4, -25, white);
  const sphere = new THREE.SphereGeometry(3.3, 32, 24); geometries.push(sphere);
  const crown = new THREE.Mesh(sphere, gold); crown.position.set(0, 23, -25); crown.castShadow = true; scene.add(crown);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const points = [new THREE.Vector3(Math.cos(a) * 2.4, .5, -25 + Math.sin(a) * 2.4),
      new THREE.Vector3(Math.cos(a) * 1.1, 12, -25 + Math.sin(a) * 1.1),
      new THREE.Vector3(Math.cos(a) * 3.4, 22, -25 + Math.sin(a) * 3.4)];
    const ribs = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, .12, 5, false);
    geometries.push(ribs); scene.add(new THREE.Mesh(ribs, white));
  }
  const stadium = cylinder(7, 8, 2.5, -18, 1.4, 47, white); stadium.scale.z = .65;
  const field = cylinder(5.5, 5.5, .1, -18, 2.72, 47, grass); field.scale.z = .65;
  const arena = cylinder(6, 8, 8, 23, 4, -49, glass); arena.rotation.y = .2;
  const ringGeometry = new THREE.TorusGeometry(6, .45, 8, 40); geometries.push(ringGeometry);
  const stadiumRing = new THREE.Mesh(ringGeometry, white);
  stadiumRing.rotation.x = -Math.PI / 2; stadiumRing.scale.y = .65;
  stadiumRing.position.set(-18, 3.2, 47); scene.add(stadiumRing);
  for (let i = 0; i < 5; i++) box(-18, 2.82, 44 + i * 1.2, 8, .05, .05, white);

  const cars = new THREE.InstancedMesh(boxGeometry, white, 140);
  for (let i = 0; i < 140; i++) {
    const x = [-60, -30, 0, 30, 60][i % 5] + (i % 2 ? .8 : -.8);
    const z = random() * 140 - 70;
    put(cars, i, x, .8, z, .65, .45, 1.3);
    cars.setColorAt(i, new THREE.Color(['#ece8d9', '#a43827', '#254e68', '#e5b750'][i % 4]));
  }
  cars.castShadow = true; scene.add(cars);
  /* Fine water streaks give the river scale without per-frame animation. */
  const rippleMaterial = material('#6095a4');
  for (let i = 0; i < 90; i++) {
    const x = random() * 180 - 90;
    box(x, .09, riverZ(x) + (random() - .5) * 10, .6 + random() * 2, .015, .035, rippleMaterial);
  }

  const draw = () => {
    renderer.render(scene, camera);
    markers.forEach((element, name) => {
      /* Separate the eastern label from Esil in the narrow overview. */
      const location: [number, number, number] = host.clientWidth < 600 && name === 'Алматы'
        ? [38, 8, 9] : districtLocations[name];
      const point = new THREE.Vector3(...location).project(camera);
      element.style.left = `${(point.x + 1) * 50}%`;
      element.style.top = `${(-point.y + 1) * 50}%`;
      element.style.visibility = Math.abs(point.x) > 1 || Math.abs(point.y) > 1 ? 'hidden' : 'visible';
    });
  };
  const resize = () => {
    const w = host.clientWidth; const h = host.clientHeight;
    const aspect = w / Math.max(1, h);
    const halfHeight = Math.max(45, 56 / aspect);
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix();
    renderer.setSize(w, h); draw();
  };
  const observer = new ResizeObserver(resize); observer.observe(host);
  controls.addEventListener('change', draw); resize();
  return () => {
    observer.disconnect(); controls.dispose();
    instances.dispose(); windowMesh.dispose(); trees.dispose(); roofs.dispose();
    equipment.dispose(); pitchedRoofs.dispose(); cars.dispose();
    geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose());
    renderer.dispose(); renderer.domElement.remove();
  };
};
