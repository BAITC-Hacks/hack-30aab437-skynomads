import { Application, Container, Graphics, Rectangle, Sprite, Text, type Texture } from 'pixi.js';
import type { Catalog, Decision, Scenario } from './api';

export interface SceneState {
  choices: Decision[];
  selected: string | null;
  layer: string;
  result: Scenario | null;
  finished: boolean;
  quarter: number;
  running: boolean;
}

const anchors = [
  { row: 23, col: 18 }, { row: 18, col: 25 }, { row: 32, col: 26 },
  { row: 26, col: 32 }, { row: 25, col: 25 },
];
const palette = [0xd9e5c8, 0xe2e8ca, 0xe9dfbf, 0xdfe5c5, 0xd7e9ca];
const position = (row: number, col: number) => ({ x: 470 + (col - row) * 31, y: -480 + (col + row) * 16 });
const tileColor = (score: number | null, district: number) => score === null ? palette[district] : score < 45 ? 0xd99681 : score < 60 ? 0xe2ca82 : 0x8cc0a1;

interface Cell {
  row: number;
  col: number;
  x: number;
  y: number;
  district: number;
  water: boolean;
  road: boolean;
  ground: Sprite;
  features: Sprite[];
}

const makeTexture = (app: Application, graphic: Graphics, width: number, height: number): Texture => {
  const texture = app.renderer.textureGenerator.generateTexture({ target: graphic, frame: new Rectangle(0, 0, width, height), resolution: 1 });
  graphic.destroy();
  return texture;
};

const buildTextures = (app: Application): Record<string, Texture> => {
  const tile = new Graphics().poly([31, 0, 62, 15, 31, 30, 0, 15]).fill(0xffffff)
    .poly([31, 0, 62, 15, 31, 30, 0, 15]).stroke({ color: 0xf7f3e9, width: 1.2 });
  const road = new Graphics().poly([31, 0, 62, 15, 31, 30, 0, 15]).fill(0xc8c5b6)
    .moveTo(14, 7).lineTo(48, 23).stroke({ color: 0xeeeadd, width: 1, alpha: .8 });
  const water = new Graphics().poly([31, 0, 62, 15, 31, 30, 0, 15]).fill(0x8bc4cc)
    .moveTo(10, 16).lineTo(31, 6).stroke({ color: 0xb0dbe0, width: 1.5, alpha: .7 });
  const tree = new Graphics().rect(9, 16, 2, 10).fill(0x756b51)
    .circle(10, 11, 8).fill(0x67a474).circle(6, 13, 5).fill(0x84b784);
  const textures: Record<string, Texture> = {
    tile: makeTexture(app, tile, 62, 31), road: makeTexture(app, road, 62, 31),
    water: makeTexture(app, water, 62, 31), tree: makeTexture(app, tree, 20, 28),
  };
  for (const height of [17, 26, 37]) {
    const roof = 7, base = height + 13;
    const building = new Graphics()
      .poly([2, roof + 6, 16, roof + 13, 16, base, 2, base - 7]).fill(0xc2b49e)
      .poly([16, roof + 13, 30, roof + 6, 30, base - 7, 16, base]).fill(0xe4d8c4)
      .poly([2, roof + 6, 16, roof - 1, 30, roof + 6, 16, roof + 13]).fill(0xf9efdd)
      .rect(22, roof + 17, 2, 4).rect(26, roof + 15, 2, 4).fill(0x9eb2a9);
    textures[`building${height}`] = makeTexture(app, building, 32, base + 2);
  }
  return textures;
};

export class CityScene {
  private readonly camera = new Container();
  private readonly ground = new Container();
  private readonly buildings = new Container();
  private readonly sites = new Container();
  private readonly traffic = new Container();
  private readonly effects = new Container();
  private readonly labels = new Container();
  private readonly cells: Cell[] = [];
  private readonly districtLabels: Container[] = [];
  private readonly textures: Record<string, Texture>;
  private readonly observer: ResizeObserver;
  private readonly vehicles: { sprite: Graphics; start: { x: number; y: number }; end: { x: number; y: number }; duration: number; offset: number }[] = [];
  private readonly pulses: { graphic: Graphics; age: number }[] = [];
  private state: SceneState | null = null;
  private zoomLevel = 1;
  private pan = { x: 0, y: 0 };
  private dragging: { x: number; y: number; moved: boolean } | null = null;
  private elapsed = 0;
  private lastQuarter = 0;

  private constructor(private readonly app: Application, private readonly host: HTMLDivElement,
    private readonly catalog: Catalog, private readonly onSelect: (name: string) => void) {
    this.textures = buildTextures(app);
    this.camera.addChild(this.ground, this.buildings, this.sites, this.traffic, this.effects, this.labels);
    app.stage.addChild(this.camera);
    this.buildCity();
    this.buildLabels();
    this.buildVehicles();
    this.observer = new ResizeObserver(() => { this.app.resize(); this.updateCamera(); });
    this.observer.observe(host);
    this.updateCamera();
    app.canvas.addEventListener('pointerdown', this.pointerDown);
    app.canvas.addEventListener('pointermove', this.pointerMove);
    app.canvas.addEventListener('pointerup', this.pointerUp);
    app.canvas.addEventListener('pointercancel', this.pointerCancel);
    app.canvas.addEventListener('wheel', this.wheel, { passive: false });
    app.ticker.add(this.tick);
  }

  static async create(host: HTMLDivElement, catalog: Catalog, onSelect: (name: string) => void): Promise<CityScene> {
    const app = new Application();
    try {
      await app.init({ resizeTo: host, backgroundColor: 0xf5f2e7, antialias: true, autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2), preference: 'webgl' });
      host.appendChild(app.canvas);
      return new CityScene(app, host, catalog, onSelect);
    } catch (error) {
      app.destroy(true, true);
      throw error;
    }
  }

  private buildCity() {
    for (let row = 0; row < 44; row++) for (let col = 0; col < 44; col++) {
      const { x, y } = position(row, col);
      const district = anchors.reduce((best, anchor, index) =>
        Math.abs(row - anchor.row) + Math.abs(col - anchor.col) < Math.abs(row - anchors[best].row) + Math.abs(col - anchors[best].col) ? index : best, 0);
      const water = col === 26 || col === 27;
      const bridge = water && (row === 21 || row === 34);
      const road = bridge || (!water && (row % 5 === 0 || col % 5 === 0 || row === 21 || row === 34));
      const ground = new Sprite(this.textures[water && !bridge ? 'water' : road ? 'road' : 'tile']);
      ground.position.set(x - 31, y);
      this.ground.addChild(ground);
      const features: Sprite[] = [];
      if (!water && !road) {
        const building = (row * 7 + col * 11) % 6 !== 0;
        if (building) {
          const height = [17, 26, 37][(row * 13 + col * 17) % 3];
          const sprite = new Sprite(this.textures[`building${height}`]);
          sprite.position.set(x - 16, y - height + 4);
          features.push(sprite);
          if ((row * 3 + col * 5) % 4 === 0) {
            const annex = new Sprite(this.textures.building17);
            annex.scale.set(.65);
            annex.position.set(x + 4, y + 7);
            features.push(annex);
          }
        } else {
          const tree = new Sprite(this.textures.tree);
          tree.position.set(x - 10, y - 5);
          features.push(tree);
        }
        for (const feature of features) this.buildings.addChild(feature);
      }
      this.cells.push({ row, col, x, y, district, water, road, ground, features });
    }
    this.buildings.children.sort((a, b) => a.y - b.y);
  }

  private buildLabels() {
    this.catalog.districts.forEach((district, index) => {
      const { x, y } = position(anchors[index].row, anchors[index].col);
      const label = new Container();
      label.position.set(x, y - 47);
      const background = new Graphics().roundRect(-51, -15, 102, 30, 8).fill(0xfffdf4);
      const name = new Text({ text: district.name, style: { fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: '700', fill: 0x284b39 } });
      name.anchor.set(.5);
      label.addChild(background, name);
      this.labels.addChild(label);
      this.districtLabels.push(label);
    });
  }

  private buildVehicles() {
    const routes = [
      [position(21, 9), position(21, 40), 3.8, 0, 0xe9a44a],
      [position(10, 25), position(40, 25), 5, .3, 0xfff4da],
      [position(34, 16), position(34, 40), 4.5, .6, 0xe2b963],
    ] as const;
    routes.forEach(([start, end, duration, offset, color]) => {
      const sprite = new Graphics().roundRect(-6, -3, 12, 6, 2).fill(color).roundRect(-3, -2, 5, 4, 1).fill(0x719293);
      this.traffic.addChild(sprite);
      this.vehicles.push({ sprite, start, end, duration, offset });
    });
  }

  update(state: SceneState) {
    if (state.quarter === 0) this.lastQuarter = 0;
    this.state = state;
    const scores = this.catalog.districts.map((district) => {
      const result = state.finished ? state.result?.districts.find((item) => item.name === district.name) : null;
      if (state.layer === 'CITY') return null;
      if (state.layer === 'QoL') return result?.score ?? district.baselineDistrictScore;
      const codes = this.catalog.indicators.filter((indicator) => indicator.direction === state.layer).map((indicator) => indicator.code);
      return codes.length ? codes.reduce((sum, code) => sum + (result?.indicators[code] ?? district.indicators[code]), 0) / codes.length : null;
    });
    for (const cell of this.cells) {
      const focus = !state.selected || state.selected === this.catalog.districts[cell.district].name;
      cell.ground.alpha = cell.water ? .85 : focus ? 1 : .55;
      cell.ground.tint = cell.water ? 0xffffff : focus ? cell.road ? 0xffffff : tileColor(scores[cell.district], cell.district) : 0xb9c1ba;
      for (const feature of cell.features) { feature.alpha = focus ? 1 : .25; feature.tint = focus ? 0xffffff : 0xaeb5ae; }
    }
    this.districtLabels.forEach((label, index) => {
      label.alpha = !state.selected || state.selected === this.catalog.districts[index].name ? 1 : .47;
    });
    this.traffic.visible = state.running;
    this.rebuildSites();
    if (state.running && state.quarter !== this.lastQuarter) {
      for (const choice of state.choices) {
        const measure = this.catalog.measures.find((item) => item.id === choice.measureId);
        if (measure?.lagQuarters !== state.quarter - 1) continue;
        const targets = choice.district ? [choice.district] : this.catalog.districts.map((district) => district.name);
        targets.forEach((name) => {
          const anchor = anchors[this.catalog.districts.findIndex((district) => district.name === name)];
          if (anchor) this.pulse(position(anchor.row, anchor.col));
        });
      }
    }
    this.lastQuarter = state.quarter;
  }

  private rebuildSites() {
    this.sites.removeChildren().forEach((child) => child.destroy({ children: true }));
    if (!this.state) return;
    this.state.choices.forEach((choice, index) => {
      const measure = this.catalog.measures.find((item) => item.id === choice.measureId);
      const complete = this.state!.finished || (this.state!.quarter > 0 && this.state!.quarter > (measure?.lagQuarters ?? 8));
      if (!choice.district) {
        const globalIndex = this.state!.choices.slice(0, index).filter((item) => !item.district).length;
        const badge = new Container();
        badge.position.set(400 + globalIndex * 140, 505);
        badge.addChild(new Graphics().roundRect(-63, -16, 126, 32, 16).fill(complete ? 0x258858 : 0x244d42));
        const text = new Text({ text: `◆ ${choice.measureId} · город`, style: { fontSize: 12, fill: 0xffffff } });
        text.anchor.set(.5);
        badge.addChild(text);
        this.sites.addChild(badge);
        return;
      }
      const districtIndex = this.catalog.districts.findIndex((district) => district.name === choice.district);
      if (districtIndex < 0) return;
      const slot = this.state!.choices.slice(0, index).filter((item) => item.district === choice.district).length;
      const anchor = anchors[districtIndex];
      const { x, y } = position(anchor.row + Math.floor(slot / 2), anchor.col + (anchor.col > 22 ? -1 : 1) * (2 + slot % 2));
      const site = new Container();
      site.position.set(x, y);
      const object = new Graphics().poly([-20, 10, 0, 0, 20, 10, 0, 20]).fill(complete ? 0xc5dbb3 : 0xefcf95);
      if (complete) object.poly([-12, 8, 0, 2, 0, -27, -12, -21]).fill(0xc3ae93)
        .poly([0, 2, 12, 8, 12, -21, 0, -27]).fill(0xe7d6b8)
        .poly([-12, -21, 0, -27, 12, -21, 0, -15]).fill(0xfaf0d9);
      else if (this.state!.quarter === 0) object.poly([-12, 7, 0, 1, 12, 7, 0, 13]).fill({ color: 0xfff4d9, alpha: .7 });
      else object.poly([-11, 7, 0, 2, 11, 7, 0, 13]).fill(0xd89465)
        .moveTo(-12, 5).lineTo(-12, -16).lineTo(12, 5).lineTo(12, -16).lineTo(-12, 5)
        .stroke({ color: 0xab704a, width: 2 }).moveTo(0, -16).lineTo(0, -38).lineTo(23, -38)
        .stroke({ color: 0xab704a, width: 2 });
      site.addChild(object);
      const tag = new Graphics().roundRect(-13, 18, 26, 14, 5).fill(complete ? 0x248657 : 0xb97b46);
      const text = new Text({ text: choice.measureId, style: { fontSize: 9, fontWeight: '700', fill: 0xffffff } });
      text.anchor.set(.5); text.position.set(0, 25);
      site.addChild(tag, text);
      this.sites.addChild(site);
    });
  }

  private pulse({ x, y }: { x: number; y: number }) {
    const graphic = new Graphics().circle(0, 0, 18).fill({ color: 0xf5db7c, alpha: .65 });
    graphic.position.set(x, y);
    this.effects.addChild(graphic);
    this.pulses.push({ graphic, age: 0 });
  }

  private readonly tick = (ticker: { deltaMS: number }) => {
    const delta = ticker.deltaMS / 1000;
    if (this.state?.running) {
      this.elapsed += delta;
      this.vehicles.forEach(({ sprite, start, end, duration, offset }) => {
        const progress = (this.elapsed / duration + offset) % 1;
        sprite.position.set(start.x + (end.x - start.x) * progress, start.y + (end.y - start.y) * progress + 15);
      });
    }
    for (let index = this.pulses.length - 1; index >= 0; index--) {
      const pulse = this.pulses[index];
      pulse.age += delta;
      pulse.graphic.alpha = Math.max(0, 1 - pulse.age / .8);
      pulse.graphic.scale.set(1 + pulse.age * 2);
      if (pulse.age >= .8) { this.effects.removeChild(pulse.graphic); pulse.graphic.destroy(); this.pulses.splice(index, 1); }
    }
  };

  private updateCamera() {
    const scale = Math.max(this.host.clientWidth / 940, this.host.clientHeight / 630) * this.zoomLevel;
    this.camera.scale.set(scale);
    this.camera.position.set(this.host.clientWidth / 2 - 470 * scale + this.pan.x,
      this.host.clientHeight / 2 - 315 * scale + this.pan.y);
    const left = -this.camera.x / scale - 80, right = (this.host.clientWidth - this.camera.x) / scale + 80;
    const top = -this.camera.y / scale - 80, bottom = (this.host.clientHeight - this.camera.y) / scale + 80;
    for (const cell of this.cells) {
      const visible = cell.x >= left && cell.x <= right && cell.y >= top && cell.y <= bottom;
      cell.ground.visible = visible;
      cell.features.forEach((feature) => { feature.visible = visible; });
    }
  }

  zoom(step: number) { this.zoomAt(step, this.host.clientWidth / 2, this.host.clientHeight / 2); }
  reset() { this.zoomLevel = 1; this.pan = { x: 0, y: 0 }; this.updateCamera(); }
  private zoomAt(step: number, x: number, y: number) {
    const oldScale = this.camera.scale.x;
    this.zoomLevel = Math.max(.7, Math.min(1.8, Math.round((this.zoomLevel + step) * 10) / 10));
    const newScale = Math.max(this.host.clientWidth / 940, this.host.clientHeight / 630) * this.zoomLevel;
    this.pan.x += (x - this.camera.x) * (1 - newScale / oldScale);
    this.pan.y += (y - this.camera.y) * (1 - newScale / oldScale);
    this.updateCamera();
  }

  private readonly pointerDown = (event: PointerEvent) => {
    this.dragging = { x: event.clientX, y: event.clientY, moved: false };
    this.app.canvas.setPointerCapture(event.pointerId);
  };
  private readonly pointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    const dx = event.clientX - this.dragging.x, dy = event.clientY - this.dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) this.dragging.moved = true;
    if (this.dragging.moved) { this.pan.x += dx; this.pan.y += dy; this.updateCamera(); }
    this.dragging.x = event.clientX; this.dragging.y = event.clientY;
  };
  private readonly pointerUp = (event: PointerEvent) => {
    const dragging = this.dragging;
    this.dragging = null;
    if (this.app.canvas.hasPointerCapture(event.pointerId)) this.app.canvas.releasePointerCapture(event.pointerId);
    if (!dragging || dragging.moved) return;
    const bounds = this.app.canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left - this.camera.x) / this.camera.scale.x;
    const y = (event.clientY - bounds.top - this.camera.y) / this.camera.scale.y;
    const labelIndex = anchors.findIndex((anchor) => { const point = position(anchor.row, anchor.col); return Math.abs(x - point.x) < 52 && Math.abs(y - (point.y - 47)) < 20; });
    if (labelIndex >= 0) { this.onSelect(this.catalog.districts[labelIndex].name); return; }
    const diff = (x - 470) / 31, sum = (y + 480 - 15) / 16;
    const row = Math.round((sum - diff) / 2), col = Math.round((sum + diff) / 2);
    const cell = this.cells.find((item) => item.row === row && item.col === col);
    if (cell && !cell.water) this.onSelect(this.catalog.districts[cell.district].name);
  };
  private readonly pointerCancel = () => { this.dragging = null; };
  private readonly wheel = (event: WheelEvent) => {
    event.preventDefault();
    const bounds = this.app.canvas.getBoundingClientRect();
    this.zoomAt(event.deltaY < 0 ? .1 : -.1, event.clientX - bounds.left, event.clientY - bounds.top);
  };

  destroy() {
    this.observer.disconnect();
    this.app.canvas.removeEventListener('pointerdown', this.pointerDown);
    this.app.canvas.removeEventListener('pointermove', this.pointerMove);
    this.app.canvas.removeEventListener('pointerup', this.pointerUp);
    this.app.canvas.removeEventListener('pointercancel', this.pointerCancel);
    this.app.canvas.removeEventListener('wheel', this.wheel);
    this.app.ticker.remove(this.tick);
    this.app.destroy(true, { children: true });
    Object.values(this.textures).forEach((texture) => texture.destroy(true));
  }
}
