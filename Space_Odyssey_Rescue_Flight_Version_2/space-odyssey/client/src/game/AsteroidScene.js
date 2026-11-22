import shuttle from '../assets/shuttle.webp';
import { engineSound } from './audio.js';
import Phaser from 'phaser';
import MissionScene from './MissionScene.js';
import { HEIGHT, WIDTH } from './constants.js';

const FLIGHT_SECONDS = 16;
const rockPoints = [18, 0, 53, 6, 72, 27, 63, 55, 37, 72, 9, 61, 0, 32];

export default class AsteroidScene extends MissionScene {
  constructor(...hooks) {
    super('flight', ...hooks);
  }

  preload() {
    this.load.image('flight-shuttle', shuttle);
  }

  create() {
    this.startMission();
    this.elapsed = 0;
    this.nextWave = 450;
    this.seconds = FLIGHT_SECONDS;
    this.drawStars(0x07171f, 0xb9fffa).setDepth(-2);
    this.trails = this.add.graphics().setDepth(-1);
    this.rocks = this.physics.add.group({ allowGravity: false });
    this.ship = this.makeBody(this.add.circle(480, 440, 15).setVisible(false), 15);
    this.ship.body.setCollideWorldBounds(true);
    this.hull = this.add.image(480, 440, 'flight-shuttle').setDisplaySize(57, 70).setDepth(1);
    this.plumes = this.add.graphics();
    this.engine = engineSound();
    this.events.once('shutdown', () => this.engine?.stop());
    this.thrusting = false;
    this.bank = 0;
    this.physics.add.overlap(this.ship, this.rocks, (_ship, rock) => {
      rock.destroy();
      this.damage(this.time.now);
    });
    this.updateHud();
  }

  spawnRock(x, speed, drift) {
    const scale = Phaser.Math.FloatBetween(0.58, 1.1);
    const rock = this.add.polygon(x, -45, rockPoints, 0x687988)
      .setStrokeStyle(2, 0xa1b0bd).setScale(scale);
    this.makeBody(rock, 30);
    this.rocks.add(rock);
    rock.body.setVelocity(drift, speed);
    rock.body.setAngularVelocity(Phaser.Math.RND.sign() * Phaser.Math.Between(30, 115));
  }

  spawnWave(elapsed) {
    const remaining = Phaser.Utils.Array.Shuffle([100, 250, 400, 560, 710, 860])
      .filter((x) => Math.abs(x - this.ship.x) > 90);
    this.spawnRock(this.ship.x, 320, 0);
    for (const x of remaining.slice(0, 2)) {
      this.spawnRock(x, Phaser.Math.Between(220, 310), Phaser.Math.Between(-45, 45));
    }
    this.nextWave = elapsed + (this.seconds > 8 ? 1040 : 880);
  }

  updateHud() {
    this.report({
      health: this.health,
      target: this.seconds,
      targetMax: FLIGHT_SECONDS,
      targetLabel: 'Seconds'
    });
  }

  update(time, delta) {
    if (this.finished) return;
    this.elapsed += delta;
    const elapsed = this.elapsed;
    const seconds = Math.max(0, FLIGHT_SECONDS - Math.floor(elapsed / 1000));
    if (seconds !== this.seconds) {
      this.seconds = seconds;
      this.updateHud();
    }
    if (this.seconds === 0) {
      this.end(true);
      return;
    }
    const move = this.movement();
    this.ship.body.setVelocity(move.x * 335, move.y * 285);
    this.hull.setAlpha(time < this.immuneUntil && Math.floor(time / 75) % 2 ? 0.45 : 1);
    this.bank = Phaser.Math.Linear(this.bank, move.x * 0.28, 1 - Math.exp(-delta / 96));
    this.hull.setRotation(this.bank).setPosition(this.ship.x, this.ship.y);
    const thrusting = move.lengthSq() > 0;
    if (thrusting !== this.thrusting) this.engine?.thrust(thrusting);
    this.thrusting = thrusting;
    this.plumes.clear().setPosition(this.ship.x, this.ship.y).setRotation(this.bank);
    for (const x of [-13, 13]) {
      const length = (thrusting ? 17 : 9) + Math.sin(time / 46) * 3;
      this.plumes.fillStyle(0x56bbff, 0.55).fillTriangle(x - 4, 26, x + 4, 26, x, 32 + length);
      this.plumes.fillStyle(0xdcffff, 0.85).fillTriangle(x - 2, 27, x + 2, 27, x, 33 + length / 2);
    }
    this.trails.clear().lineStyle(1, 0x81e1fd, 0.25);
    for (let i = 0; i < 22; i++) {
      const y = (elapsed * (0.14 + (i % 3) * 0.07) + i * 91) % (HEIGHT + 30);
      const x = (i * 149 + 50) % WIDTH;
      this.trails.lineBetween(x, y - 18, x, y);
    }
    if (elapsed >= this.nextWave) this.spawnWave(elapsed);
    this.prune(this.rocks, 85);
  }
}
