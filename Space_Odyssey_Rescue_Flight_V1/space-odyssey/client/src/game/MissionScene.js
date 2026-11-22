import { playSound } from './audio.js';
import Phaser from 'phaser';
import { HEIGHT, MAX_HEALTH, WIDTH } from './constants.js';

export default class MissionScene extends Phaser.Scene {
  constructor(key, controls, report, finish, showResult) {
    super({ key });
    this.controls = controls;
    this.report = report;
    this.finish = finish;
    this.showResult = showResult;
  }

  startMission() {
    this.health = MAX_HEALTH;
    this.immuneUntil = 0;
    this.finished = false;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,SHIFT');
    this.input.keyboard.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
  }

  movement() {
    const controls = this.controls;
    const keys = this.keys;
    const arrows = this.cursors;
    return new Phaser.Math.Vector2(
      Number(arrows.right.isDown || keys.D.isDown || controls.right || false) -
      Number(arrows.left.isDown || keys.A.isDown || controls.left || false),
      Number(arrows.down.isDown || keys.S.isDown || controls.down || false) -
      Number(arrows.up.isDown || keys.W.isDown || controls.up || false)
    ).normalize();
  }

  makeBody(shape, radius) {
    this.physics.add.existing(shape);
    shape.body.setCircle(radius, shape.width / 2 - radius, shape.height / 2 - radius);
    return shape;
  }

  damage(time) {
    if (time < this.immuneUntil || this.finished) return;
    playSound('impact');
    this.health -= 1;
    this.immuneUntil = time + 850;
    this.cameras.main.shake(115, 0.006);
    this.updateHud();
    if (this.health <= 0) this.end(false);
  }

  end(won) {
    if (this.finished) return;
    playSound(won ? 'clear' : 'defeat');
    this.finished = true;
    this.physics.pause();
    this.showResult(won);
    const camera = this.cameras.main;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      const focus = won ? (this.boss ?? this.ship) : (this.player ?? this.ship);
      const color = won ? 0xaaffdd : 0xff9a80;
      for (let i = 0; i < 2; i++) {
        const pulse = this.add.circle(focus.x, focus.y, 20).setStrokeStyle(2, color)
          .setDepth(8).setAlpha(0);
        this.tweens.add({ targets: pulse, scale: { from: 0.6, to: won ? 6 : 3 },
          alpha: { from: 0.85, to: 0 }, delay: i * 135, duration: 840, ease: 'Cubic.Out',
          onComplete: () => pulse.destroy() });
      }
      if (this.hull && won) {
        this.plumes.clear();
        this.tweens.add({ targets: this.hull, y: -80, rotation: 0, duration: 1050, ease: 'Quad.In' });
      } else if (!won) {
        const actor = this.hull ?? this.pilotSprite ?? this.pilot;
        this.tweens.add({ targets: actor, y: actor.y + 16, angle: 12, alpha: 0.12,
          duration: 820, ease: 'Sine.Out' });
      }
    }
    this.time.delayedCall(1460, () => camera.fadeOut(420, 8, 11, 22));
    this.time.delayedCall(1920, () => this.finish(won));
  }

  drawStars(background, color) {
    const art = this.add.graphics();
    art.fillStyle(background).fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < 110; i++) {
      const size = i % 8 === 0 ? 2 : 1;
      art.fillStyle(color, 0.22 + (i % 6) * 0.12);
      art.fillCircle((i * 137 + 29) % WIDTH, (i * 71 + 17) % HEIGHT, size);
    }
    return art;
  }

  prune(group, margin = 55) {
    for (const object of group.getChildren().slice()) {
      if (object.x < -margin || object.x > WIDTH + margin ||
          object.y < -margin || object.y > HEIGHT + margin) object.destroy();
    }
  }
}
