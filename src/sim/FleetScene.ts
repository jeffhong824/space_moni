import Phaser from 'phaser';
import { sScaleElevated } from '../domain/spaceWeather.ts';
import { shipCrewStatus } from '../world/shipStatus.ts';
import type { WorldState } from '../world/worldState.ts';
import { ensureCrewAnims, preloadSimAssets, sheetCols } from './assets.ts';
import { crewPosesForShip } from './crewPose.ts';
import { isWalkable, layoutOf, TILE, wallFrame, type ShipLayout } from './layouts.ts';

export type SimSelect =
  | { kind: 'ship'; id: string }
  | { kind: 'crew'; id: string }
  | { kind: 'module'; shipId: string; roomId: string };

export type SimTranslate = (key: string, vars?: Record<string, string | number>) => string;

const MAP_W = 1080;
const MAP_H = 640;
const EARTH = { x: 170, y: 380 };
const MOON = { x: 560, y: 180 };
const MARS = { x: 980, y: 420 };

function geomHit(obj: Phaser.GameObjects.GameObject, x: number, y: number, w: number, h: number) {
  obj.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(x, y, w, h),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
    pixelPerfect: false,
  });
}

function statusColor(status: string): number {
  if (status === 'Critical') return 0xfb7185;
  if (status === 'Attention') return 0xfbbf24;
  return 0x5eead4;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawStarfield(g: Phaser.GameObjects.Graphics, w: number, h: number, seed: number, n: number) {
  const rnd = mulberry(seed);
  g.fillStyle(0x020617, 1);
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const a = 0.25 + rnd() * 0.7;
    g.fillStyle(0xe2e8f0, a);
    g.fillRect(x, y, rnd() > 0.92 ? 2 : 1, rnd() > 0.92 ? 2 : 1);
  }
}

function bezier(a: number, x0: number, y0: number, x1: number, y1: number, bulge: number) {
  return {
    x: x0 + (x1 - x0) * a,
    y: y0 + (y1 - y0) * a - bulge * 4 * a * (1 - a),
  };
}

function enablePan(scene: Phaser.Scene) {
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!p.isDown) return;
    const cam = scene.cameras.main;
    cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
    cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
  });
}

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillStyle(0x020617, 1);
    g.fillRect(0, 0, width, height);
    this.add
      .text(width / 2, height / 2, this.registry.get('t')?.('sim.loadingEngine') ?? 'Loading…', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    preloadSimAssets(this.load);
  }

  create() {
    ensureCrewAnims(this);
    this.scene.start('map');
  }
}

class MapScene extends Phaser.Scene {
  private shipSprites = new Map<string, Phaser.GameObjects.Image>();
  private labels = new Map<string, { bg: Phaser.GameObjects.Graphics; title: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text }>();

  constructor() {
    super('map');
  }

  create() {
    const stars = this.add.graphics();
    drawStarfield(stars, MAP_W, MAP_H, 11, 420);

    const arcs = this.add.graphics();
    arcs.lineStyle(1, 0x5eead4, 0.45);
    this.drawDashedArc(arcs, EARTH.x, EARTH.y, MOON.x, MOON.y, 70);
    this.drawDashedArc(arcs, EARTH.x, EARTH.y, MARS.x, MARS.y, -70);

    this.add.image(EARTH.x, EARTH.y, 'earth').setScale(2).setOrigin(0.5);
    this.add.image(MOON.x, MOON.y, 'moon').setScale(1).setOrigin(0.5);
    this.add.image(MARS.x, MARS.y, 'mars').setScale(2).setOrigin(0.5);

    const t: SimTranslate = this.registry.get('t');
    this.add
      .text(20, 14, t('sim.notNasa'), {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setOrigin(0, 0);

    for (const id of ['ship-harmony', 'ship-gateway', 'ship-ares', 'ship-mare']) {
      const img = this.add.image(0, 0, id).setOrigin(0.5);
      const w = img.width;
      const h = img.height;
      geomHit(img, -w / 2, -h / 2, w, h);
      img.on('pointerdown', () => this.onShip(id));
      this.shipSprites.set(id, img);

      const bg = this.add.graphics();
      const title = this.add.text(0, 0, '', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        color: '#f1f5f9',
      }).setOrigin(0.5, 0);
      const sub = this.add.text(0, 0, '', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '9px',
        color: '#94a3b8',
      }).setOrigin(0.5, 0);
      this.labels.set(id, { bg, title, sub });
    }

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    const fit = Math.min(this.scale.width / MAP_W, this.scale.height / MAP_H);
    this.cameras.main.setZoom(Math.max(1, Math.min(2, Math.floor(fit) || 1)));
    this.cameras.main.centerOn(MAP_W / 2, MAP_H / 2);
    enablePan(this);
    this.placeShips();
  }

  private drawDashedArc(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, bulge: number) {
    for (let i = 0; i < 100; i += 2) {
      const a = i / 100;
      const b = (i + 1) / 100;
      const p0 = bezier(a, x0, y0, x1, y1, bulge);
      const p1 = bezier(b, x0, y0, x1, y1, bulge);
      g.lineBetween(p0.x, p0.y, p1.x, p1.y);
    }
  }

  private shipXY(id: string, world: WorldState): { x: number; y: number } {
    const ship = world.ships.find((s) => s.def.id === id);
    const loc = ship?.location;
    const rad = ((loc?.phaseDeg ?? 0) * Math.PI) / 180;
    if (id === 'ship-harmony') {
      return { x: 230 + Math.cos(rad) * 28, y: 195 + Math.sin(rad) * 16 };
    }
    if (id === 'ship-gateway') {
      return { x: 430 + Math.cos(rad) * 22, y: 95 + Math.sin(rad) * 14 };
    }
    if (id === 'ship-mare') {
      return { x: 670 + Math.sin(rad) * 6, y: 330 };
    }
    const au = loc?.auFromEarth ?? 1.05;
    const a = Phaser.Math.Clamp((au - 1.05) / 0.55, 0.28, 0.72);
    return bezier(a, EARTH.x, EARTH.y, MARS.x, MARS.y, -70);
  }

  private onShip(id: string) {
    const onSelect: (s: SimSelect) => void = this.registry.get('onSelect');
    onSelect?.({ kind: 'ship', id });
    const mobile = Boolean(this.registry.get('mobile'));
    if (!mobile) {
      this.registry.set('interiorId', id);
      this.scene.start('interior');
      const cb = this.registry.get('onInterior') as ((id: string | null) => void) | undefined;
      cb?.(id);
    }
  }

  private placeShips() {
    const world: WorldState | undefined = this.registry.get('world');
    const t: SimTranslate = this.registry.get('t');
    if (!world) return;
    for (const id of this.shipSprites.keys()) {
      const ship = world.ships.find((s) => s.def.id === id);
      if (!ship) continue;
      const pos = this.shipXY(id, world);
      const img = this.shipSprites.get(id)!;
      img.setPosition(pos.x, pos.y);
      const lab = this.labels.get(id)!;
      const status = shipCrewStatus(ship);
      const color = statusColor(status);
      const title = t(ship.def.nameKey);
      const sub = `${t(ship.def.kindKey)} · ${ship.crew.length}`;
      lab.title.setText(title);
      lab.sub.setText(sub);
      const tw = Math.max(lab.title.width, lab.sub.width);
      const x = pos.x;
      const y = pos.y + img.displayHeight / 2 + 6;
      lab.bg.clear();
      lab.bg.fillStyle(0x0f172a, 0.92);
      lab.bg.lineStyle(1, color, 1);
      lab.bg.fillRoundedRect(x - tw / 2 - 8, y, tw + 16, 36, 6);
      lab.bg.strokeRoundedRect(x - tw / 2 - 8, y, tw + 16, 36, 6);
      lab.title.setPosition(x, y + 3);
      lab.sub.setPosition(x, y + 19);
    }
  }

  update() {
    this.placeShips();
  }
}

class InteriorScene extends Phaser.Scene {
  private crewSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private animProps: Array<{ sprite: Phaser.GameObjects.Sprite; cols: number; dir: number; frames: number; ds: number; flash?: boolean }> = [];
  private layout!: ShipLayout;
  private padX = 24;
  private padY = 40;

  constructor() {
    super('interior');
  }

  create() {
    ensureCrewAnims(this);
    const shipId: string = this.registry.get('interiorId') || 'ship-harmony';
    this.layout = layoutOf(shipId);
    const L = this.layout;
    const worldW = L.cols * TILE + this.padX * 2;
    const worldH = L.rows * TILE + this.padY + 24;

    const stars = this.add.graphics();
    drawStarfield(stars, worldW + 200, worldH + 200, 17, 280);

    const co2 = this.shipHasCo2();
    const storm = this.shipHasStorm();

    for (let y = 0; y < L.rows; y++) {
      for (let x = 0; x < L.cols; x++) {
        if (!isWalkable(L, x, y)) continue;
        const room = L.rooms.find((r) => x > r.x0 && x < r.x1);
        const frame = room?.floor ?? 0;
        this.add.image(this.tx(x), this.ty(y), 'floors', frame).setOrigin(0, 0);
      }
    }

    for (let y = 0; y < L.rows; y++) {
      for (let x = 0; x < L.cols; x++) {
        if (isWalkable(L, x, y)) continue;
        if (!this.isHull(x, y)) continue;
        const mask =
          (y > 0 && !isWalkable(L, x, y - 1) && this.isHull(x, y - 1) ? 1 : 0) |
          (y < L.rows - 1 && !isWalkable(L, x, y + 1) && this.isHull(x, y + 1) ? 2 : 0) |
          (x < L.cols - 1 && !isWalkable(L, x + 1, y) && this.isHull(x + 1, y) ? 4 : 0) |
          (x > 0 && !isWalkable(L, x - 1, y) && this.isHull(x - 1, y) ? 8 : 0);
        const wall = wallFrame(mask);
        this.add.image(this.tx(x), this.ty(y), wall.key, wall.frame).setOrigin(0, 0);
      }
    }

    const hatchCols = sheetCols(this, 'hatch_shuttle_opening');
    for (const d of L.doors) {
      this.add.image(this.tx(d.x), this.ty(d.y), 'hatch_shuttle_opening', hatchCols - 1).setOrigin(0, 0);
    }

    for (let x = 1; x < L.cols - 1; x += 4) {
      if (isWalkable(L, x, 1)) {
        this.add.image(this.tx(x), this.ty(1), 'light_tube', 0).setOrigin(0, 0);
      }
    }
    const railY = Math.floor(L.interiorH / 2);
    for (let x = 2; x < L.cols - 1; x += 3) {
      if (isWalkable(L, x, railY)) {
        this.add.image(this.tx(x), this.ty(railY), 'handrail', 2).setOrigin(0, 0);
      }
    }

    for (const p of L.props) {
      const key = this.textures.exists(p.tex) ? p.tex : 'crate';
      const px = this.tx(p.x);
      const py = this.ty(p.y);
      const originBottom = p.originBottom || Boolean(p.tall && p.tall > 32);
      if (p.anim && this.textures.get(key).frameTotal > 1) {
        const cols = sheetCols(this, key);
        const dir = p.dir ?? 0;
        const spr = this.add.sprite(px, originBottom ? py + TILE : py, key, dir * cols + (p.frame ?? 0));
        spr.setOrigin(0, originBottom ? 1 : 0);
        this.animProps.push({
          sprite: spr,
          cols,
          dir,
          frames: p.anim.frames,
          ds: p.anim.ds,
          flash: key === 'co2_scrubber' && co2,
        });
      } else {
        const frame = p.dir != null ? (p.dir * sheetCols(this, key) + (p.frame ?? 0)) : (p.frame ?? 0);
        const img = this.textures.get(key).frameTotal > 1
          ? this.add.image(px, originBottom ? py + TILE : py, key, frame)
          : this.add.image(px, originBottom ? py + TILE : py, key);
        img.setOrigin(0, originBottom ? 1 : 0);
      }
    }

    const t: SimTranslate = this.registry.get('t');
    for (const room of L.rooms) {
      const cx = this.tx((room.x0 + room.x1) / 2);
      const label = t(room.labelKey);
      const tw = Math.max(48, label.length * 6.2);
      const x = cx;
      const y = this.padY - 28;
      const g = this.add.graphics();
      g.fillStyle(0x0f172a, 0.92);
      g.lineStyle(1, 0x5eead4, 1);
      g.fillRoundedRect(x - tw / 2 - 6, y, tw + 12, 18, 4);
      g.strokeRoundedRect(x - tw / 2 - 6, y, tw + 12, 18, 4);
      this.add
        .text(x, y + 3, label, { fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#e2e8f0' })
        .setOrigin(0.5, 0);

      const hx = this.tx(room.x0 + 1);
      const hy = this.ty(1);
      const hw = (room.x1 - room.x0 - 1) * TILE;
      const hh = (L.rows - 2) * TILE;
      const hit = this.add.rectangle(hx, hy, hw, hh, 0x000000, co2 && room.id === 'eclss' ? 0.08 : 0.001).setOrigin(0, 0);
      if (co2 && room.id === 'eclss') hit.setFillStyle(0xfb923c, 0.12);
      if (storm && room.id === L.shelterRoom) hit.setFillStyle(0x38bdf8, 0.08);
      geomHit(hit, 0, 0, hw, hh);
      hit.on('pointerdown', () => {
        const onSelect: (s: SimSelect) => void = this.registry.get('onSelect');
        onSelect?.({ kind: 'module', shipId, roomId: room.id });
      });
    }

    this.add
      .text(12, 8, t('sim.backFleet'), {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        color: '#5eead4',
        backgroundColor: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(20)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-8, -4, 88, 22),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
        pixelPerfect: false,
      })
      .on('pointerdown', () => {
        this.registry.set('interiorId', null);
        this.scene.start('map');
        const cb = this.registry.get('onInterior') as ((id: string | null) => void) | undefined;
        cb?.(null);
      });

    this.add
      .text(this.scale.width - 12, 8, t('sim.interiorNote'), {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '10px',
        color: '#94a3b8',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20);

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    const zoom = Math.max(1, Math.min(2, Math.floor(this.scale.height / (L.rows * TILE * 0.55)) || 1));
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(this.tx(9), this.ty(L.rows / 2));
    enablePan(this);
    this.syncCrew();
  }

  private tx(tileX: number) {
    return this.padX + tileX * TILE;
  }

  private ty(tileY: number) {
    return this.padY + tileY * TILE;
  }

  private isHull(x: number, y: number): boolean {
    const L = this.layout;
    if (x < 0 || y < 0 || x >= L.cols || y >= L.rows) return false;
    if (isWalkable(L, x, y)) return false;
    if (x === 0 || y === 0 || x === L.cols - 1 || y === L.rows - 1) return true;
    if (L.rooms.some((r) => r.x0 === x || r.x1 === x)) return true;
    return (
      isWalkable(L, x - 1, y) ||
      isWalkable(L, x + 1, y) ||
      isWalkable(L, x, y - 1) ||
      isWalkable(L, x, y + 1)
    );
  }

  private ship() {
    const world: WorldState | undefined = this.registry.get('world');
    const id: string = this.registry.get('interiorId') || 'ship-harmony';
    return world?.ships.find((s) => s.def.id === id);
  }

  private shipHasCo2() {
    return this.ship()?.crew.some((c) => c.event === 'event.co2') ?? false;
  }

  private shipHasStorm() {
    return sScaleElevated(this.ship()?.sScaleUsed);
  }

  private syncCrew() {
    const ship = this.ship();
    if (!ship) return;
    const t = Date.now();
    const poses = crewPosesForShip(t, ship);
    const seen = new Set<string>();
    for (const pose of poses) {
      seen.add(pose.crewId);
      let spr = this.crewSprites.get(pose.crewId);
      const key = `crew-${pose.sheet}`;
      if (!spr) {
        spr = this.add.sprite(this.tx(pose.x), this.ty(pose.y), key, 0).setOrigin(0, 0).setDepth(10);
        geomHit(spr, 0, 0, 32, 32);
        spr.on('pointerdown', () => {
          const onSelect: (s: SimSelect) => void = this.registry.get('onSelect');
          onSelect?.({ kind: 'crew', id: pose.crewId });
        });
        this.crewSprites.set(pose.crewId, spr);
      }
      if (spr.texture.key !== key) spr.setTexture(key);
      spr.setPosition(this.tx(pose.x), this.ty(pose.y));
      spr.setVisible(!pose.anim || true);
      const crew = ship.crew.find((c) => c.def.id === pose.crewId);
      const hide = Boolean(crew && pose.anim && layoutOf(ship.def.id).rooms
        .flatMap((r) => r.stations)
        .some((s) => s.hideSprite && Math.abs(s.x - pose.x) < 0.4 && Math.abs(s.y - pose.y) < 0.4 && !pose.walking));
      spr.setVisible(!hide);
      const animKey = `${key}-${pose.anim}`;
      if (this.anims.exists(animKey) && spr.anims.currentAnim?.key !== animKey) {
        spr.play(animKey);
      }
    }
    for (const [id, spr] of this.crewSprites) {
      if (!seen.has(id)) {
        spr.destroy();
        this.crewSprites.delete(id);
      }
    }
  }

  update(_time: number, _delta: number) {
    const now = Date.now() / 1000;
    for (const p of this.animProps) {
      const fps = 10 / Math.max(0.2, p.ds);
      const fi = Math.floor(now * fps) % p.frames;
      p.sprite.setFrame(p.dir * p.cols + fi);
      if (p.flash) {
        const pulse = 0.55 + 0.45 * Math.sin(now * 8);
        p.sprite.setTint(Phaser.Display.Color.GetColor(255, Math.floor(80 + 80 * pulse), 40));
      }
    }
    this.syncCrew();
  }
}

export function bootFleetGame(
  parent: HTMLElement,
  data: {
    world: WorldState;
    onSelect: (sel: SimSelect) => void;
    mobile: boolean;
    t: SimTranslate;
    onInterior?: (id: string | null) => void;
  }
): {
  destroy: (remove: boolean) => void;
  setWorld: (w: WorldState) => void;
  setTranslator: (t: SimTranslate) => void;
  openInterior: (id: string) => void;
  closeInterior: () => void;
} {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: parent.clientWidth || 800,
    height: Math.max(280, parent.clientHeight || 420),
    backgroundColor: '#020617',
    scene: [],
    scale: { mode: Phaser.Scale.RESIZE },
    audio: { noAudio: true },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
      powerPreference: 'low-power',
    },
    banner: false,
  });
  game.registry.set('world', data.world);
  game.registry.set('onSelect', data.onSelect);
  game.registry.set('mobile', data.mobile);
  game.registry.set('t', data.t);
  game.registry.set('interiorId', null);
  game.registry.set('onInterior', data.onInterior ?? null);
  game.scene.add('boot', BootScene, true);
  game.scene.add('map', MapScene, false);
  game.scene.add('interior', InteriorScene, false);
  return {
    destroy: (remove: boolean) => game.destroy(remove),
    setWorld: (w) => game.registry.set('world', w),
    setTranslator: (fn) => game.registry.set('t', fn),
    openInterior: (id) => {
      if (data.mobile) return;
      if (!game.textures.exists('floors')) return;
      game.registry.set('interiorId', id);
      game.scene.stop('map');
      game.scene.stop('interior');
      game.scene.start('interior');
      const cb = game.registry.get('onInterior') as ((id: string | null) => void) | undefined;
      cb?.(id);
    },
    closeInterior: () => {
      game.registry.set('interiorId', null);
      game.scene.stop('interior');
      game.scene.start('map');
      const cb = game.registry.get('onInterior') as ((id: string | null) => void) | undefined;
      cb?.(null);
    },
  };
}
