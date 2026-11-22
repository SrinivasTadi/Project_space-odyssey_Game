import Phaser from 'phaser';
import { playSound } from './audio.js';
import guardianTexture from '../assets/guardian.webp';
import { wardens } from '../data/planets.js';
import MissionScene from './MissionScene.js';
import { bossArt } from './bossArt.js';
import { HEIGHT, MAGAZINE, RECHARGE_MS, WIDTH } from './constants.js';
import {setupMarsArmor,setupJupiterLights} from './arenaDetail.js';
import { drawPilot } from './pilot.js';

import jupiterMotion from '../assets/jupiter-motion.webp';
import saturnMotion from '../assets/saturn-motion.webp';
import stationDeck from '../assets/station.webp';
import fracturedEarth from '../assets/fractured-earth.webp';
import { drawRelay, echoStyles, rifleLights, recoil, signatureCue, dissipate } from './combatEffects.js';

import battleCast from '../assets/guardians-battle.webp';
const castFrame = {mars:0,uranus:1,neptune:2,venus:3,mercury:4,earthDefense:5};
import terrain from '../assets/terrain.webp';
const terrainFrame = { mars:0, saturn:1, uranus:2, neptune:3, venus:4, mercury:5 };

const spread = [-0.34, -0.17, 0, 0.17, 0.34];
const ring = Array.from({ length: 12 }, (_, index) => index * Math.PI / 6);

export default class CombatScene extends MissionScene {
  constructor(planet, ...hooks) {
    super(planet, ...hooks);
    this.planet = planet;
    this.warden = { ...wardens[planet] };
  }

  preload() {
    this.load.image('guardian', guardianTexture);
    if (this.planet in castFrame) this.load.spritesheet('battle-cast',battleCast,{frameWidth:152,frameHeight:152});
    if (this.planet in terrainFrame) this.load.spritesheet('terrain',terrain,{frameWidth:512,frameHeight:512});
    if (this.planet === 'jupiter') this.load.image('station', stationDeck);
    if (this.planet === 'earthDefense') this.load.image('fractured-earth',fracturedEarth);
    if (this.planet === 'jupiter' || this.planet === 'saturn') {
      this.load.spritesheet('mechanism', this.planet === 'jupiter' ? jupiterMotion : saturnMotion,
        { frameWidth: 192, frameHeight: 192 });
    }
  }

  create() {
    this.startMission();
    this.bossHealth = this.warden.hp;
    this.shotAt = 0;
    this.ammo = MAGAZINE;
    this.rechargeMs = 0;
    this.bossTravel = 0;
    this.chargeScale = 1;
    this.trailAt = 0;
    this.strikeCount = 0;
    this.phase = 1;
    this.frozenUntil = 0;
    this.effects = this.add.graphics().setDepth(5);
    this.pools = [];
    this.hitAt = -Infinity;
    this.dodgeUntil = 0;
    this.dodgeReadyAt = 0;
    this.attackAt = null;
    this.pendingAttack = null;
    this.fadingAttack = null;
    this.dodgeHeld = false;
    this.runPhase = 0;
    this.facing = 1;
    this.dodgeDirection = new Phaser.Math.Vector2(1, 0);
    this.exposedUntil = 0;
    this.mechanismPose = 0;
    this.echo = null;
    this.drawArena();
    if (this.planet === 'jupiter') {
      this.relay = {x:325, y:383};
      this.relayArt = this.add.graphics().setDepth(.6);
    }
    this.friendly = this.physics.add.group({ allowGravity: false });
    this.hostile = this.physics.add.group({ allowGravity: false });
    this.drawBoss();
    if(this.planet==='earthDefense' && this.textures.exists('battle-cast')){
      const frame=this.textures.getFrame('battle-cast',castFrame.earthDefense);
      const source=frame.source.image, size=frame.cutWidth, texture=this.textures.createCanvas('architect-rim',size+6,size+6);
      const ctx=texture.context;
      for(const [x,y] of [[1,3],[5,3],[3,1],[3,5]]){
        ctx.drawImage(source,frame.cutX,frame.cutY,size,size,x,y,size,size);
      }
      ctx.globalCompositeOperation='source-in';ctx.fillStyle='#a4dfff';ctx.fillRect(0,0,size+6,size+6);
      ctx.globalCompositeOperation='destination-out';ctx.drawImage(source,frame.cutX,frame.cutY,size,size,3,3,size,size);
      texture.refresh();
      const rim=this.add.image(this.bossCore.x,this.bossCore.y,'architect-rim').setDepth(.99).setAlpha(.77);
      this.events.on(Phaser.Scenes.Events.POST_UPDATE,()=>{
        const core=this.bossCore;
        rim.setPosition(core.x,core.y).setRotation(core.rotation).setScale(core.scaleX,core.scaleY)
          .setVisible(this.bossHealth>0 || this.reviving);
      });
    }
    if (this.planet==='saturn') {
      let active=true;
      const stopKeeper = () => {
        active = false;
        this.liveKeeper?.dispose();
        this.liveKeeper = null;
      };
      this.events.once('shutdown', stopKeeper);
      this.events.once('destroy', stopKeeper);
      import('./orbitalModels.js').then(({attachRingkeeper})=>{
        if(active && this.bossHealth>0) this.liveKeeper=attachRingkeeper(this);
      });
    }
    this.player = this.makeBody(this.add.circle(480, 440, 16).setVisible(false), 16);
    this.player.body.setCollideWorldBounds(true);
    this.pilot = this.add.graphics().setDepth(3);
    this.pilotShadow = this.add.ellipse(480, 459, 44, 13, 0x010918, 0.62).setDepth(2.9);
    if (this.textures.exists('guardian')) {
      this.pilotSprite = this.add.image(480, 440, 'guardian').setDisplaySize(48, 74).setDepth(3.1);
    } else {
      this.pilotShadow.setVisible(false);
    }
    if(this.planet==='mars' && this.textures.exists('battle-cast')) this.updateArmor=setupMarsArmor(this);
    if(this.relay && this.pilotSprite) this.stationLights=setupJupiterLights(this);
    this.warning = this.add.graphics().setDepth(2);

    this.physics.add.overlap(this.boss, this.friendly, (_boss, shot) => {
      const { x, y } = shot;
      shot.destroy();
      if (this.finished || this.reviving || this.bossHealth === 0) return;
      if (this.relay && this.time.now >= this.exposedUntil) {
        this.spark(x, y, 0x88bcff, 2);
        return;
      }
      this.bossHealth -= 1;
      this.updateArmor?.();
      playSound('hit');
      this.spark(x, y, this.warden.highlight, 3);
      this.hitAt = this.time.now;
      this.updateHud();
      if (this.bossHealth === 0) {
        if (this.planet === 'earthDefense' && this.phase === 1) {
          this.revive();
          return;
        }
        this.immuneUntil = Infinity;
        this.physics.pause();
        this.warning.clear();
        this.spark(this.boss.x, this.boss.y, this.warden.highlight, 17);
        if(this.terrainShade)this.tweens.add({targets:this.terrainShade,alpha:0,duration:1200});
        if(this.liveKeeper) this.tweens.add({targets:this.liveKeeper.shadows,alpha:0,duration:380});
        this.stationLights?.clear();
        dissipate(this);
        this.time.delayedCall(510, () => this.end(true));
      }
    });
    this.physics.add.overlap(this.player, this.hostile, (_player, shot) => {
      shot.destroy();
      this.damage(this.time.now);
    });
    this.physics.add.overlap(this.player, this.boss, () => this.damage(this.time.now));
    this.updateHud();
  }

  revive() {
    playSound('revive');
    this.reviving = true;
    this.immuneUntil = Infinity;
    this.phase = 2;
    this.strikeCount = 0;
    this.physics.pause();
    this.player.body.setVelocity(0);
    this.hostile.clear(true, true);
    this.friendly.clear(true, true);
    this.warning.clear();
    this.pendingAttack = this.fadingAttack = null;
    this.warden.cooldown = 770;
    this.warden.telegraph = 550;
    this.warden.hp = 55;
    this.boss.setScale(1.45);
    this.cameras.main.shake(420, 0.009);
    this.spark(this.boss.x, this.boss.y, this.warden.highlight, 24);
    this.tweens.add({ targets: this.bossCore, scale: 1.45, angle: 360, duration: 1600 });
    this.tweens.addCounter({ from: 0, to: this.warden.hp, duration: 2100,
      onUpdate: tween => {
        const health = Math.round(tween.getValue());
        if (health !== this.bossHealth) { this.bossHealth = health; this.updateHud(); }
      },
      onComplete: () => {
        this.bossHealth = this.warden.hp;
        this.reviving = false;
        this.immuneUntil = this.time.now + 700;
        this.attackAt = this.time.now + 700;
        this.physics.resume();
        this.updateHud();
      }
    });
    this.updateHud();
  }

  spark(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(14, 56);
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), color).setDepth(5);
      this.tweens.add({
        targets: particle, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance,
        alpha: 0, scale: 0.3, duration: 280, ease: 'Cubic.Out',
        onComplete: () => particle.destroy()
      });
    }
  }

  drawBoss() {
    const { armor, highlight } = this.warden;
    const mars = this.planet === 'mars';
    const core = this.add.graphics().setPosition(480, 128).setDepth(1);
    const shell = mars
      ? this.add.polygon(480, 128, [0, 3, 28, 17, 41, 0, 73, 0, 86, 17, 114, 3, 108, 53, 86, 80, 72, 101, 42, 101, 28, 80, 6, 53], armor)
        .setStrokeStyle(3, highlight)
      : this.add.circle(480, 128, 42).setVisible(false);
    this.boss = this.makeBody(shell, 42);
    if (this.textures.exists('mechanism')) {
      core.destroy();
      this.bossCore = this.add.sprite(480,128,'mechanism').setDepth(1);
      return;
    }
    if (this.textures.exists('battle-cast')) {
      core.destroy();
      this.boss.setVisible(false);
      this.bossCore=this.add.sprite(480,128,'battle-cast',castFrame[this.planet]).setDepth(1);
      return;
    }
    if (mars) {
      core.fillStyle(0x461a25).fillRoundedRect(-24, 20, 48, 15, 4);
      core.fillStyle(highlight).fillEllipse(-20, -5, 19, 8).fillEllipse(20, -5, 19, 8);
      core.fillStyle(0xffe6ad).fillTriangle(-20, 20, -9, 20, -14, 31).fillTriangle(9, 20, 20, 20, 14, 31);
    } else {
      bossArt[this.planet](core, this.warden);
    }
    this.bossCore = core;
  }

  drawArena() {
    const { background, stars, floor, grid } = this.warden;
    const art = this.drawStars(background, stars);
    art.fillStyle(floor, 0.76).fillRoundedRect(20, 55, 920, 464, 18);
    art.lineStyle(2, grid, 0.8).strokeRoundedRect(20, 55, 920, 464, 18);
    art.lineStyle(1, grid, 0.28);
    for (let x = 60; x < WIDTH - 20; x += 56) art.lineBetween(x, 60, x, HEIGHT - 22);
    for (let y = 100; y < HEIGHT - 20; y += 50) art.lineBetween(22, y, WIDTH - 22, y);
    art.lineStyle(2, grid, 0.43).strokeCircle(480, 285, 145).strokeCircle(480, 285, 85);
    this.arenaGlow = this.add.graphics().setDepth(-0.1);
    art.setDepth(-1);
    if(this.textures.exists('terrain')){
      this.terrain=this.add.image(480,270,'terrain',terrainFrame[this.planet]).setDisplaySize(960,650).setDepth(-.8).setAlpha(.82);
      this.terrainShade=this.add.rectangle(480,270,960,540,background,.27).setDepth(-.7);
    }
    if(this.planet==='earthDefense' && this.textures.exists('fractured-earth')) {
      this.add.image(480,270,'fractured-earth').setDisplaySize(960,540).setDepth(-.8);
      // Subdue the plate behind the Architect so its projectiles and aim markers stay legible.
      this.add.rectangle(480,270,960,540,0x08101c,.30).setDepth(-.7);
    }
    if(this.planet==='jupiter' && this.textures.exists('station')) {
      this.add.image(480,270,'station').setDisplaySize(960,540).setDepth(-.8);
    }
  }

  updateHud() {
    this.report({
      health: this.health,
      ammo: this.ammo,
      rechargeMs: this.rechargeMs,
      target: this.bossHealth,
      targetMax: this.warden.hp,
      targetLabel: this.planet === 'earthDefense' ? 'Phase ' + this.phase : 'Boss',
      warning: this.reviving ? 'Architect: “You broke my shell. Now face the core.”'
        : this.freezeSeconds ? 'Frozen · ' + this.freezeSeconds + 's' : this.echo ? 'Echo incoming · ' + echoStyles[this.echo.type][0]
        : this.planet === 'earthDefense' && this.pendingAttack ? echoStyles[this.pendingAttack.type][0]
        : this.relay && this.pendingAttack?.columns.some(x => Math.abs(x-this.relay.x)<53) ? 'Relay targeted · dodge sideways'
        : this.pendingAttack ? this.warden.warning
        : this.relay ? (this.time.now < this.exposedUntil ? 'Shield down · fire at the core' : 'Lure lightning across the amber relay, then dodge') : ''
    });
  }

  tickRecharge(delta) {
    if (this.rechargeMs === 0) return;
    const previous = Math.ceil(this.rechargeMs / 100);
    this.rechargeMs = Math.max(0, this.rechargeMs - delta);
    if (!this.rechargeMs) {
      this.ammo = MAGAZINE;
      playSound('charged');
    }
    if (Math.ceil(this.rechargeMs / 100) !== previous) this.updateHud();
  }

  fire(time) {
    if (!(this.keys.SPACE.isDown || this.controls.fire) || !this.ammo || time < this.shotAt) return;
    playSound('fire');
    this.shotAt = time + 175;
    const shot = this.makeBody(this.add.circle(this.player.x, this.player.y - 10, 5, 0xa4ffd8), 5);
    shot.setStrokeStyle(2, 0xecfff5, 0.8);
    this.friendly.add(shot);
    this.ammo -= 1;
    if (this.ammo === 0) {
      this.rechargeMs = RECHARGE_MS;
      playSound('empty');
    }
    this.updateHud();
  }

  getAttack(time, forcedType) {
    const { x, y } = this.player;
    const { pattern, radius = 0, telegraph } = this.warden;
    const cycle = this.phase === 1 ? ['columns', 'strike', 'wave'] : ['ring', 'spread', 'columns', 'wave', 'strike'];
    const type = forcedType ?? (pattern === 'mixed' ? cycle[this.strikeCount % cycle.length] : pattern);
    if (!forcedType) this.strikeCount += 1;
    const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, x, y);
    return {
      type, x, y, radius, started: time, at: time + telegraph,
      columns: [x, x < WIDTH / 2 ? x + 230 : x - 230],
      rows: [y, y < HEIGHT / 2 ? y + 150 : y - 150],
      angles: type === 'ring' ? ring.map((offset) => angle + offset) : spread.map((offset) => angle + offset)
    };
  }

  drawAttack(attack, intensity, active) {
    const art = this.warning;
    const color = this.planet === 'earthDefense' ? echoStyles[attack.type][1] : this.warden.highlight;
    art.fillStyle(color, intensity * 0.55);
    art.lineStyle(active ? 4 : 2, color, intensity);
    if (!active) signatureCue(this,attack,Math.max(0,Math.min(1,(this.time.now-attack.started)/(attack.at-attack.started))),color);
    if (attack.type === 'columns') {
      for (const x of attack.columns) {
        art.fillRect(x - 32, 0, 64, HEIGHT);
        if(active) {
          art.lineStyle(9,color,intensity*.28).lineBetween(x,0,x,HEIGHT);
          for(let y=0;y<HEIGHT;y+=24) {
            const offset=Math.sin(y*2.7)*12, next=Math.sin((y+24)*2.7)*12;
            art.lineStyle(4,0xecfcff,intensity).lineBetween(x+offset,y,x+next,y+24);
            if(y%72===0)art.lineStyle(2,color,intensity).lineBetween(x+offset,y,x+27,y+17);
          }
        }
        for (let y = 0; y < HEIGHT; y += 30) {
          const zig = y % 60 ? 13 : -13;
          art.lineBetween(x + zig, y, x - zig, y + 30);
        }
      }
    } else if (attack.type === 'wave') {
      for (const y of attack.rows) {
        art.fillRect(0, y - 28, WIDTH, 56);
        for (let x = 0; x < WIDTH; x += 18) {
          const crest = u => y + Math.sin(u / 40 + this.time.now / 100) * 11;
          art.lineBetween(x, crest(x), x + 18, crest(x + 18));
        }
      }
    } else if (attack.type === 'strike') {
      art.fillCircle(attack.x, attack.y, attack.radius);
      art.strokeCircle(attack.x, attack.y, attack.radius);
    } else if (attack.type === 'ring') {
      art.strokeCircle(this.boss.x, this.boss.y, 54 + intensity * 34);
    } else {
      for (const angle of attack.angles) {
        art.lineBetween(this.boss.x, this.boss.y,
          this.boss.x + Math.cos(angle) * 1050, this.boss.y + Math.sin(angle) * 1050);
      }
    }
  }

  resolveAttack(attack, time) {
    const { x, y } = this.player;
    const echoStyle = this.planet === 'earthDefense' ? echoStyles[attack.type] : null;
    playSound(echoStyle ? echoStyle[2] : this.planet);
    if (this.relay && attack.columns.some(x => Math.abs(x-this.relay.x) < 53)) {
      this.exposedUntil = time + 4600;
      this.attackAt = this.exposedUntil + 400;
      this.spark(this.relay.x,this.relay.y,0xaffff1,16);
      playSound('charged');
    }
    if (this.planet === 'venus') {
      const drop = this.add.ellipse(this.boss.x, this.boss.y, 26, 15, 0xdfff48).setDepth(4);
      this.tweens.add({ targets: drop, x: attack.x, y: attack.y, duration: 360,
        onUpdate: () => {
          if (Math.hypot(drop.x - this.player.x, drop.y - this.player.y) < 24) this.damage(this.time.now);
        },
        onComplete: () => {
          playSound('splash');
          drop.destroy();
          this.spark(attack.x, attack.y, 0xdeff55, 9);
          this.pools.push({ x: attack.x, y: attack.y, end: this.time.now + 3500 });
        }
      });
      return;
    }
    if (attack.type === 'spread' || attack.type === 'ring') {
      for (const angle of attack.angles) {
        const shot = this.makeBody((this.planet === 'mercury'
          ? this.add.ellipse(this.boss.x, this.boss.y, 37, 11, 0xffc060).setRotation(angle)
          : this.add.circle(this.boss.x, this.boss.y, 11, echoStyle?.[1] ?? this.warden.highlight,
              this.planet === 'saturn' ? 0.12 : 1)).setStrokeStyle(3, this.warden.highlight), 10);
        this.hostile.add(shot);
        shot.body.setVelocity(Math.cos(angle) * (this.warden.speed ?? 340), Math.sin(angle) * (this.warden.speed ?? 340));
      }
      return;
    }
    this.fadingAttack = attack;
    const hit = attack.type === 'columns' ? attack.columns.some((column) => Math.abs(x - column) < 43)
      : attack.type === 'wave' ? attack.rows.some((row) => Math.abs(y - row) < 39)
      : Phaser.Math.Distance.Between(x, y, attack.x, attack.y) < attack.radius + 11;
    if (hit) {
      if (this.planet === 'uranus' && time >= this.immuneUntil) {
        this.frozenUntil = time + 3000;
        this.immuneUntil = time;
        this.dodgeUntil = 0;
        this.player.body.setVelocity(0);
        this.attackAt = this.frozenUntil + 900;
      }
      this.spark(x, y, this.warden.highlight, 7);
      this.damage(time);
    }
  }

  runAttack(time) {
    this.attackAt ??= time + 1000;
    this.warning.clear();
    if (!this.echo && !this.pendingAttack && time >= this.attackAt) {
      this.pendingAttack = this.getAttack(time);
      this.updateHud();
    }
    const attack = this.pendingAttack;
    if (attack && time >= attack.at) {
      this.pendingAttack = null;
      this.attackAt = time + this.warden.cooldown;
      this.resolveAttack(attack, time);
      if (!this.finished && this.planet==='earthDefense' && this.phase===2) {
        const partners={ring:'strike',spread:'columns',columns:'wave',wave:'ring',strike:'spread'};
        this.echo=this.getAttack(time,partners[attack.type]);
        this.echo.at=time+850;
      }
      this.updateHud();
    } else if (attack) {
      const ratio = (time - attack.started) / this.warden.telegraph;
      this.drawAttack(attack, 0.4 + ratio * 0.44, false);
    }
    if(this.echo && !this.finished) {
      if(time>=this.echo.at) {
        this.resolveAttack(this.echo,time);
        this.echo=null;
        this.attackAt=time+this.warden.cooldown;
        this.updateHud();
      } else this.drawAttack(this.echo,.48+.36*(time-this.echo.started)/850,false);
    }
    if (this.fadingAttack) {
      const alpha = 1 - (time - this.fadingAttack.at) / 180;
      if (alpha > 0) this.drawAttack(this.fadingAttack, alpha, true);
      else this.fadingAttack = null;
    }
  }

  animatePilot(time, delta, moving, dodging) {
    this.runPhase = moving ? this.runPhase + delta * 0.022 : 0;
    const { x, y } = this.player;
    const phase = this.runPhase || time * 0.002;
    const firing = time > this.shotAt - 175 && time < this.shotAt - 107;
    const opacity = time < this.immuneUntil && Math.floor(time / 75) % 2 ? 0.5 : 1;
    if (this.pilotSprite) {
      const step = moving ? Math.sin(phase) * 4 : Math.sin(phase) * 1.4;
      this.pilotSprite.setPosition(x, y - 10 - Math.abs(step))
        .setRotation(dodging ? this.facing * 0.27 : step * 0.022)
        .setFlipX(this.facing < 0)
        .setDisplaySize(dodging ? 55 : 48, 74 - Math.abs(step))
        .setAlpha(opacity);
      this.pilotShadow.setPosition(x, y + 24);
      this.pilot.clear();
      if (firing) {
        this.pilot.fillStyle(0xacffba, 0.7).fillCircle(x + this.facing * 22, y - 37, 8);
      }
    } else {
      drawPilot(this.pilot, phase, this.facing, dodging, firing);
      this.pilot.setPosition(x, y).setAlpha(opacity);
    }
    if (dodging && time >= this.trailAt) {
      this.trailAt = time + 36;
      const ghost = this.pilotSprite
        ? this.add.image(x, y - 10, 'guardian').setDisplaySize(55, 71)
          .setFlipX(this.facing < 0).setRotation(this.facing * 0.27)
        : this.add.graphics().setPosition(x, y);
      if (!this.pilotSprite) drawPilot(ghost, this.runPhase, this.facing, true, false);
      ghost.setDepth(2.8).setAlpha(0.28);
      this.tweens.add({ targets: ghost, alpha: 0, duration: 175, onComplete: () => ghost.destroy() });
    }
  }

  update(time, delta) {
    if (this.finished) return;
    this.tickRecharge(delta);
    if (this.reviving || this.bossHealth === 0) return;
    this.effects.clear();
    rifleLights(this);
    if(this.relay) drawRelay(this,time);
    this.pools = this.pools.filter(pool => pool.end > time);
    for (const pool of this.pools) {
      this.effects.fillStyle(0x8fba19, 0.52).fillCircle(pool.x, pool.y, 48);
      for (let i = 0; i < 7; i++) {
        this.effects.lineStyle(2, 0xd9ff67, 0.8).strokeCircle(pool.x + Math.sin(i * 4) * 31,
          pool.y + Math.cos(i * 3) * 26, 2 + (time / 160 + i) % 6);
      }
      if (Math.hypot(this.player.x - pool.x, this.player.y - pool.y) < 50) this.damage(time);
    }
    if (this.finished) return;
    const seconds = Math.max(0, Math.ceil((this.frozenUntil - time) / 1000));
    if (seconds !== this.freezeSeconds) {
      if (!seconds && this.freezeSeconds) {
        playSound('thaw');
        this.spark(this.player.x, this.player.y, 0xbaffff, 16);
      }
      this.freezeSeconds = seconds;
      this.updateHud();
    }
    if (seconds) {
      const size = Math.min(1, (3000 - (this.frozenUntil - time)) / 170);
      const {x,y}=this.player;
      this.effects.fillStyle(0x83dff6,.54).fillRoundedRect(x-25,y-42,50,72*size,8);
      this.effects.lineStyle(2,0xd4ffff,.88).strokeRoundedRect(x-25,y-42,50,72*size,8);
      this.effects.fillStyle(0xe1feff,.3).fillTriangle(x-22,y-38,x+17,y-38,x-9,y+12*size);
      this.effects.lineStyle(2,0x438ba9,.8).lineBetween(x+18,y-29,x+7,y-12).lineBetween(x+7,y-12,x+18,y+2);

      return;
    }
    const move = this.movement();
    const dodge = Boolean(this.keys.SHIFT.isDown || this.controls.dodge);
    if (dodge && !this.dodgeHeld && time >= this.dodgeReadyAt) {
      this.dodgeDirection = move.lengthSq() ? move.clone() : new Phaser.Math.Vector2(0, 1);
      playSound('dodge');
      this.dodgeUntil = time + 155;
      this.dodgeReadyAt = time + 850;
      this.immuneUntil = Math.max(this.immuneUntil, this.dodgeUntil + 45);
    }
    this.dodgeHeld = dodge;
    const dodging = time < this.dodgeUntil;
    const velocity = dodging ? this.dodgeDirection : move;
    const speed = dodging ? 650 : 285;
    this.player.body.setVelocity(velocity.x * speed, velocity.y * speed);
    if (velocity.x) this.facing = Math.sign(velocity.x);
    this.animatePilot(time, delta, velocity.lengthSq() > 0, dodging);

    // Freeze the boss while its warning is on screen.
    if (!this.pendingAttack && !this.echo && time >= this.exposedUntil) this.bossTravel += delta;
    this.boss.x = 480 + Math.sin(this.bossTravel / 630) * 218;
    this.bossCore.setPosition(this.boss.x, this.boss.y + Math.sin(time / 180) * 3 + recoil(this,time-this.hitAt));
    if(this.bossCore.setFrame && this.textures.exists('mechanism')){
      const windup=this.pendingAttack ? Math.min(1,(time-this.pendingAttack.started)/this.warden.telegraph) : 0;
      this.mechanismPose+=((time<this.exposedUntil ? 1 : windup)-this.mechanismPose)*(1-Math.exp(-delta/75));
      if (this.liveKeeper) this.liveKeeper.draw(time);
      else this.bossCore.setFrame(Math.round(this.mechanismPose*8));
    }
    const windupScale = this.pendingAttack ? 1.12 + Math.sin(time / 100) * 0.05 : 1;
    this.chargeScale += (windupScale - this.chargeScale) * (1 - Math.exp(-delta / 80));
    this.bossCore.setScale((this.phase === 2 ? 1.45 : 1) * this.chargeScale);
    const hitFlash = time - this.hitAt < 65;
    if (this.planet === 'mars') this.boss.setFillStyle(hitFlash ? 0xfff4eb : this.warden.armor);
    this.bossCore.setAlpha(hitFlash ? 0.70 : 1);
    this.arenaGlow.clear().lineStyle(2, this.warden.highlight, 0.10 + Math.sin(time / 510) * 0.045);
    this.arenaGlow.strokeCircle(480, 285, 156 + Math.sin(time / 730) * 15);
    this.fire(time);
    for (const shot of this.friendly.getChildren()) this.physics.moveToObject(shot, this.boss, 1030);
    // Render projectile trails in one graphics buffer, with no per-frame particles.
    for (const shot of this.hostile.getChildren()) {
      const velocity = shot.body.velocity;
      if (this.planet === 'mars' || this.planet === 'mercury') {
        const tail = this.planet === 'mercury' ? 0.15 : 0.085;
        this.effects.lineStyle(this.planet === 'mars' ? 7 : 3, this.warden.armor, 0.7)
          .lineBetween(shot.x, shot.y, shot.x - velocity.x * tail, shot.y - velocity.y * tail);
        this.effects.fillStyle(0xffe8ad, 0.9).fillCircle(shot.x, shot.y, 3);
      }
    }
    this.runAttack(time);
    this.stationLights?.update(time);
    this.prune(this.friendly);
    this.prune(this.hostile);
  }
}
