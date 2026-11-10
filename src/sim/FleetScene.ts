import Phaser from 'phaser';
import type { ActivityKey, WorldState } from '../world/worldState';

export type SimSelect = { kind: 'ship' | 'crew'; id: string };
export type SimTranslate = (key: string, vars?: Record<string, string | number>) => string;

const SHIP_LAYOUT = [
  { id: 'ship-harmony', x: 0.32, y: 0.38, color: 0x38bdf8 },
  { id: 'ship-gateway', x: 0.52, y: 0.28, color: 0xa78bfa },
  { id: 'ship-ares', x: 0.78, y: 0.55, color: 0xfb7185 },
  { id: 'ship-mare', x: 0.58, y: 0.72, color: 0xfbbf24 },
];

function geomHit(obj: Phaser.GameObjects.GameObject, x: number, y: number, w: number, h: number) {
  // Explicit rectangle hit tests — never pixelPerfect / texture sampling / snapshots.
  obj.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(x, y, w, h),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
    pixelPerfect: false,
  });
}

/**
 * Procedural 2D fleet + interior. No NASA logos; circles/rects only (CC0-equivalent original art).
 * Canvas renderer avoids WebGL readPixels GPU stalls from pixel-perfect hits or snapshots.
 */
export class FleetScene extends Phaser.Scene {
  world!: WorldState;
  onSelect!: (sel: SimSelect) => void;
  mobile = false;
  t: SimTranslate = (k) => k;
  private interiorId: string | null = null;

  constructor() {
    super('fleet');
  }

  init(data: { world: WorldState; onSelect: (sel: SimSelect) => void; mobile: boolean; t: SimTranslate }) {
    this.world = data.world;
    this.onSelect = data.onSelect;
    this.mobile = data.mobile;
    this.t = data.t;
  }

  create() {
    this.cameras.main.setBackgroundColor('#020617');
    this.redraw();
  }

  setWorld(world: WorldState) {
    this.world = world;
  }

  setTranslator(t: SimTranslate) {
    this.t = t;
    this.redraw();
  }

  private redraw() {
    this.tweens.killAll();
    this.children.removeAll();
    const w = this.scale.width;
    const h = this.scale.height;
    this.drawStars(w, h);

    if (this.interiorId) {
      this.drawInterior(w, h, this.interiorId);
      return;
    }

    this.add.circle(w * 0.12, h * 0.5, Math.min(28, w * 0.04), 0xfbbf24).setStrokeStyle(2, 0xfde68a);
    this.add.circle(w * 0.28, h * 0.52, 18, 0x38bdf8);
    this.add.circle(w * 0.275, h * 0.51, 6, 0x4ade80);
    this.add.circle(w * 0.48, h * 0.32, 8, 0xe2e8f0);

    for (const slot of SHIP_LAYOUT) {
      const ship = this.world.ships.find((s) => s.def.id === slot.id);
      if (!ship) continue;
      const x = slot.x * w;
      const y = slot.y * h;
      const body = this.add.rectangle(0, 0, 78, 30, slot.color, 0.95).setStrokeStyle(1, 0xf8fafc);
      const wing = this.add.rectangle(-44, 0, 18, 10, 0xcbd5e1);
      const label = this.add
        .text(0, 22, this.t(ship.def.nameKey), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#e2e8f0',
        })
        .setOrigin(0.5, 0);
      const sim = this.add
        .text(0, -22, this.t('common.simulation'), { fontFamily: 'monospace', fontSize: '9px', color: '#fbbf24' })
        .setOrigin(0.5, 1);
      const container = this.add.container(x, y, [wing, body, label, sim]);
      container.setSize(96, 52);
      geomHit(container, 0, 0, 96, 52);
      container.on('pointerdown', () => {
        this.onSelect({ kind: 'ship', id: ship.def.id });
        this.interiorId = ship.def.id;
        this.redraw();
      });
      this.tweens.add({
        targets: container,
        y: y + 6,
        duration: 2200 + x,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });

      if (!this.mobile) {
        ship.crew.forEach((c, i) => this.drawAstronaut(x - 28 + i * 18, y + 42, c.activityKey, c.def.id, slot.color, false));
      }
    }

    this.add
      .text(12, h - 18, this.t('sim.notNasa'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#64748b',
      })
      .setOrigin(0, 1);
  }

  private drawInterior(w: number, h: number, shipId: string) {
    const ship = this.world.ships.find((s) => s.def.id === shipId);
    if (!ship) return;
    this.add.rectangle(w / 2, h / 2, w * 0.86, h * 0.72, 0x0f172a).setStrokeStyle(2, 0x64748b);
    this.add
      .text(w / 2, h * 0.16, this.t('sim.interiorTitle', { name: this.t(ship.def.nameKey) }), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    const rooms = [
      { key: 'sim.roomHab', x: 0.28, y: 0.48 },
      { key: 'sim.roomLab', x: 0.5, y: 0.48 },
      { key: 'sim.roomEclss', x: 0.72, y: 0.48 },
    ];
    rooms.forEach((room, i) => {
      const rx = room.x * w;
      const ry = room.y * h;
      this.add.rectangle(rx, ry, w * 0.2, h * 0.32, 0x1e293b).setStrokeStyle(1, 0x94a3b8);
      this.add
        .text(rx, ry - h * 0.14, this.t(room.key), { fontFamily: 'monospace', fontSize: '10px', color: '#cbd5e1' })
        .setOrigin(0.5);
      const crew = ship.crew.filter((_, idx) => idx % 3 === i);
      crew.forEach((c, k) => {
        this.drawAstronaut(rx - 18 + k * 22, ry + 8, c.activityKey, c.def.id, 0x38bdf8, true);
      });
    });

    ship.crew
      .filter((c) => c.activityKey === 'act.eva')
      .forEach((c, i) => this.drawAstronaut(w * 0.12, h * 0.42 + i * 28, 'act.eva', c.def.id, 0xf8fafc, true));

    const backHit = this.add.rectangle(52, 26, 88, 28, 0x0f172a, 0.01);
    geomHit(backHit, -44, -14, 88, 28);
    this.add.text(24, 20, this.t('sim.backFleet'), { fontFamily: 'monospace', fontSize: '12px', color: '#7dd3fc' });
    backHit.on('pointerdown', () => {
      this.interiorId = null;
      this.redraw();
    });
    this.add
      .text(12, h - 18, this.t('sim.interiorNote'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#64748b',
      })
      .setOrigin(0, 1);
  }

  private drawAstronaut(x: number, y: number, activity: ActivityKey, id: string, color: number, interior: boolean) {
    const body = this.add.rectangle(x, y, 8, 16, 0xf8fafc).setStrokeStyle(1, color);
    const head = this.add.circle(x, y - 12, 5, 0xfde68a);
    if (activity === 'act.sleep' || activity === 'act.preSleep') {
      body.setRotation(1.57);
      head.setPosition(x + 12, y);
    }
    if (activity === 'act.eva') {
      this.add.circle(x, y - 12, 7, 0xe2e8f0, 0.35);
    }
    if (activity === 'act.science' || activity === 'act.maintenance' || activity === 'act.comms') {
      this.add.rectangle(x + 10, y - 4, 14, 8, 0x334155).setStrokeStyle(1, 0x94a3b8);
    }
    const hotspot = this.add.rectangle(x, y - 4, 22, 36, 0x000000, 0.001);
    geomHit(hotspot, -11, -18, 22, 36);
    hotspot.on('pointerdown', () => this.onSelect({ kind: 'crew', id }));
    const bob = activity === 'act.exercise' || activity === 'act.eva' ? 7 : activity === 'act.sleep' ? 2 : 4;
    this.tweens.add({
      targets: [body, head, hotspot],
      y: `+=${bob}`,
      duration: activity === 'act.exercise' ? 420 : activity === 'act.sleep' ? 2800 : 900,
      yoyo: true,
      repeat: -1,
    });
    if (interior) {
      this.add
        .text(x, y + 16, this.t(activity), { fontFamily: 'monospace', fontSize: '8px', color: '#94a3b8' })
        .setOrigin(0.5, 0);
    }
  }

  private drawStars(w: number, h: number) {
    const g = this.add.graphics();
    for (let i = 0; i < 140; i++) {
      const x = (i * 97) % w;
      const y = (i * 53) % h;
      g.fillStyle(0xe2e8f0, 0.35 + (i % 5) * 0.1);
      g.fillCircle(x, y, i % 7 === 0 ? 1.4 : 0.8);
    }
  }
}

export function bootFleetGame(
  parent: HTMLElement,
  data: { world: WorldState; onSelect: (sel: SimSelect) => void; mobile: boolean; t: SimTranslate }
): { destroy: (remove: boolean) => void; setWorld: (w: WorldState) => void; setTranslator: (t: SimTranslate) => void } {
  const scene = new FleetScene();
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
      pixelArt: false,
      roundPixels: true,
      powerPreference: 'low-power',
    },
    banner: false,
  });
  game.scene.add('fleet', scene, true, data);
  return {
    destroy: (remove: boolean) => game.destroy(remove),
    setWorld: (w) => scene.setWorld(w),
    setTranslator: (fn) => scene.setTranslator(fn),
  };
}
