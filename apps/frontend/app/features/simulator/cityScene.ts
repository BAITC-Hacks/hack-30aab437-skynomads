import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const districtLocations: Record<string, [number, number, number]> = {
  Есиль: [10, 10, -23], Алматы: [38, 8, 9], Сарыарка: [-36, 7, -17],
  Байконур: [-33, 6, 28], Нура: [5, 8, 28],
};

export const createCityScene = (host: HTMLDivElement, markers: Map<string, HTMLButtonElement>) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a0b9c1');
  const camera = new THREE.OrthographicCamera(-65, 65, 45, -45, 1, 400);
  camera.position.set(60, 90, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.minZoom = .8;
  controls.maxZoom = 2.1;
  controls.minPolarAngle = .25;
  controls.maxPolarAngle = 1.05;
  controls.update();
  scene.add(new THREE.HemisphereLight('#d8efff', '#66714a', 2.5));
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
  const grass = material('#73935e');
  const pavement = material('#d7c9af');
  const road = material('#515c60');
  const white = material('#eee2ca');
  const gold = material('#dfb440', .65);
  const glass = material('#49879d', .45);
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(boxGeometry, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = h > 1; mesh.receiveShadow = true; scene.add(mesh);
    return mesh;
  };
  box(0, -1.1, 0, 190, 2, 160, grass);
  const riverZ = (x: number) => 5 + Math.sin(x * .042) * 12;
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
  river(8.5, .01, '#d4c5a2');
  river(6.5, .05, '#428698');

  for (const x of [-60, -30, 0, 30, 60]) {
    box(x, .13, 0, 3.2, .2, 150, road);
    box(x, .26, riverZ(x), 4, .45, 21, pavement);
    box(x, .52, riverZ(x), 2.7, .1, 21, road);
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
        || (Math.abs(x) < 13 && z < -17 && z > -36) || random() < .16) continue;
      const center = Math.abs(x) < 34 && z < -17;
      buildings.push({ x, z, h: center ? 10 + random() * 17 : 2 + random() * 8,
        w: 2.5 + random() * 1.7, d: 2.5 + random() * 1.5,
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
  const windows: [number, number, number, number, number, number][] = [];
  buildings.forEach((b) => {
    for (let y = 1.4; y < b.h - .3; y += 1.5) {
      windows.push([b.x, y, b.z + b.d / 2 + .02, b.w * .8, .45, .03],
        [b.x + b.w / 2 + .02, y, b.z, .03, .45, b.d * .8]);
    }
  });
  const windowMesh = new THREE.InstancedMesh(boxGeometry, glass, windows.length);
  windows.forEach((v, i) => put(windowMesh, i, ...v)); scene.add(windowMesh);
  const treeGeometry = new THREE.IcosahedronGeometry(1, 1); geometries.push(treeGeometry);
  const treePositions: [number, number][] = [];
  for (let i = 0; i < 1300; i++) {
    const x = random() * 176 - 88; const z = random() * 136 - 68;
    if (Math.abs(z - riverZ(x)) < 8.5 || Math.abs(x % 30) < 3
      || [-58, -36, -16, 37, 59].some((street) => Math.abs(z - street) < 2)
      || buildings.some((b) => Math.abs(b.x - x) < 3 && Math.abs(b.z - z) < 3)
      || (Math.abs(x) < 6 && Math.abs(z + 25) < 6)) continue;
    treePositions.push([x, z]);
  }
  const trees = new THREE.InstancedMesh(treeGeometry, material('#477037'), treePositions.length);
  treePositions.forEach(([x, z], i) => { const s = .65 + random() * .6; put(trees, i, x, s, z, s, s * 1.5, s); });
  trees.castShadow = true; scene.add(trees);

  const cylinder = (r1: number, r2: number, h: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const geo = new THREE.CylinderGeometry(r1, r2, h, 24); geometries.push(geo);
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true; scene.add(mesh); return mesh;
  };
  cylinder(6, 6, .3, 0, .3, -25, pavement);
  cylinder(.7, 1.9, 17, 0, 8.8, -25, white);
  const sphere = new THREE.SphereGeometry(3.1, 24, 16); geometries.push(sphere);
  const crown = new THREE.Mesh(sphere, gold); crown.position.set(0, 20, -25); crown.castShadow = true; scene.add(crown);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    cylinder(.12, .2, 19, Math.cos(a) * 1.7, 10, -25 + Math.sin(a) * 1.7, white);
  }
  const stadium = cylinder(7, 8, 2.5, -18, 1.4, 47, white); stadium.scale.z = .65;
  const field = cylinder(5.5, 5.5, .1, -18, 2.72, 47, grass); field.scale.z = .65;
  const arena = cylinder(6, 8, 8, 23, 4, -49, glass); arena.rotation.y = .2;

  const draw = () => {
    renderer.render(scene, camera);
    markers.forEach((element, name) => {
      const point = new THREE.Vector3(...districtLocations[name]).project(camera);
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
    instances.dispose(); windowMesh.dispose(); trees.dispose();
    geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose());
    renderer.dispose(); renderer.domElement.remove();
  };
};
