import * as THREE from 'three';
import { initiativeColors } from './mapInitiatives';
import type { MapInitiative } from './mapInitiatives';

interface CityBuilding {
  x: number; z: number; h: number; w: number; d: number; color: THREE.Color;
}

/* Illustrative project sites in the synthetic city, not real cadastral coordinates. */
const districtSites: Record<string, [number, number]> = {
  Есиль: [18, -29], Алматы: [35, -1], Сарыарка: [-36, -24],
  Байконур: [-36, 24], Нура: [8, 29],
};
const siteOffsets = [[-8, -4], [0, -3], [7, -4], [-5, 4], [5, 4]];

export const createCityHighlights = (scene: THREE.Scene, buildings: CityBuilding[], bodies: THREE.InstancedMesh) => {
  const layer = new THREE.Group();
  layer.name = 'planned-initiatives';
  scene.add(layer);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const anchors = new Map<string, THREE.Vector3>();

  const clear = () => {
    layer.clear(); anchors.clear();
    geometries.forEach((geometry) => geometry.dispose()); geometries.clear();
    materials.forEach((material) => material.dispose()); materials.clear();
    buildings.forEach((building, index) => bodies.setColorAt(index, building.color));
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  };
  const geometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value; };
  const surface = (color: THREE.Color, opacity: number) => {
    const value = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, depthWrite: false, depthTest: false,
      toneMapped: false, side: THREE.DoubleSide,
    });
    materials.add(value);
    return value;
  };

  const update = (initiatives: MapInitiative[], focusedKey: string | null) => {
    clear();
    if (!initiatives.length) return;
    const usedBuildings = new Set<number>();
    const siteCounts = new Map<string, number>();
    const cube = geometry(new THREE.BoxGeometry(1, 1, 1));
    const diamond = geometry(new THREE.OctahedronGeometry(.7));

    [...initiatives].sort((a, b) => a.order - b.order || a.district.localeCompare(b.district)).forEach((initiative) => {
      const center = districtSites[initiative.district];
      if (!center) return;
      const count = siteCounts.get(initiative.district) ?? 0;
      siteCounts.set(initiative.district, count + 1);
      const offset = siteOffsets[count % siteOffsets.length];
      const x = center[0] + offset[0]; const z = center[1] + offset[1];
      let nearest = -1; let distance = Infinity;
      buildings.forEach((building, index) => {
        if (usedBuildings.has(index)) return;
        const candidate = (building.x - x) ** 2 + (building.z - z) ** 2;
        if (candidate < distance) { nearest = index; distance = candidate; }
      });
      if (nearest < 0) return;
      usedBuildings.add(nearest);
      const building = buildings[nearest];
      const focus = initiative.key === focusedKey;
      const color = new THREE.Color(focus ? '#64b0ff' : initiativeColors[initiative.measure.direction] ?? '#559bff');
      bodies.setColorAt(nearest, building.color.clone().lerp(color, focus ? .7 : .4));

      const site = new THREE.Group();
      site.name = initiative.key;
      site.position.set(building.x, 0, building.z);
      layer.add(site);
      const w = building.w + 2; const d = building.d + 2;
      const addBox = (px: number, py: number, pz: number, sx: number, sy: number, sz: number, mat: THREE.Material) => {
        const mesh = new THREE.Mesh(cube, mat);
        mesh.position.set(px, py, pz); mesh.scale.set(sx, sy, sz);
        mesh.renderOrder = 5; site.add(mesh); return mesh;
      };
      const plotFill = surface(color, focus ? .24 : .1);
      const glow = surface(color, focus ? .3 : .15);
      const edge = surface(color, focus ? 1 : .86);
      addBox(0, .17, 0, w, .04, d, plotFill);
      for (const spread of [0, .36]) {
        const mat = spread ? glow : edge;
        const thickness = spread ? .65 : .13;
        addBox(0, .2, -(d + spread) / 2, w + spread, .08, thickness, mat);
        addBox(0, .2, (d + spread) / 2, w + spread, .08, thickness, mat);
        addBox(-(w + spread) / 2, .2, 0, thickness, .08, d + spread, mat);
        addBox((w + spread) / 2, .2, 0, thickness, .08, d + spread, mat);
      }
      const bounds = geometry(new THREE.BoxGeometry(building.w + .12, building.h + .4, building.d + .12));
      const outlineGeometry = geometry(new THREE.EdgesGeometry(bounds));
      const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: focus ? .95 : .5, depthTest: false, depthWrite: false, toneMapped: false });
      materials.add(lineMaterial);
      const outline = new THREE.LineSegments(outlineGeometry, lineMaterial);
      outline.position.y = building.h / 2; outline.renderOrder = 6; site.add(outline);
      const beaconHeight = building.h + 3;
      addBox(0, (beaconHeight + .2) / 2, 0, .05, beaconHeight, .05, glow);
      const beacon = new THREE.Mesh(diamond, edge);
      beacon.position.y = beaconHeight; beacon.renderOrder = 7; site.add(beacon);
      anchors.set(initiative.key, new THREE.Vector3(building.x, beaconHeight + 1.6, building.z));
    });
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  };
  return { anchors, update, dispose: () => { clear(); scene.remove(layer); } };
};
