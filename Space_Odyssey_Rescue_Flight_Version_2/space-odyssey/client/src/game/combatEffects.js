import { RECHARGE_MS } from './constants.js';

export const echoStyles = {
  columns: ['Jovian lightning',0xa6ddff,'jupiter'], strike: ['Polar fracture',0xa4ffff,'uranus'],
  wave: ['Tidal surge',0x7198ff,'neptune'], ring: ['Ring shrapnel',0xffd796,'saturn'],
  spread: ['Solar flare',0xff9852,'mercury']
};

export function rifleLights(scene) {
  const {x,y}=scene.player, art=scene.effects;
  for (let i=0;i<3;i++) {
    const on=scene.ammo>i;
    art.fillStyle(on?(scene.ammo<=3?0xffc471:0x8dfceb):0x394250)
      .fillRoundedRect(x+scene.facing*(11+i*4)-1,y-12,3,6,1);
  }
  if (scene.rechargeMs>0) {
    const start=-Math.PI/2, progress=1-scene.rechargeMs/RECHARGE_MS;
    art.lineStyle(3,0x273847,.9).strokeCircle(x,y+17,24);
    art.lineStyle(3,0xffce78).beginPath().arc(x,y+17,24,start,start+progress*Math.PI*2).strokePath();
  }
}

export function drawRelay(scene,time) {
  const {x,y}=scene.relay, art=scene.relayArt.clear();
  const exposed=time<scene.exposedUntil;
  const color=exposed?0x97ffe8:0xffc96e;
  art.lineStyle(4,0x334759,.9).lineBetween(x,y,x,500).lineBetween(x,500,900,500);
  art.lineStyle(2,color,.65).strokeEllipse(x,y+8,85,35);
  art.fillStyle(0x193040).fillRoundedRect(x-20,y-20,40,36,7);
  for(let i=-1;i<=1;i++) {
    art.fillStyle(0x677d87).fillRect(x+i*12-3,y-29,6,26);
    art.fillStyle(color,.8).fillCircle(x+i*12,y-30,4);
  }
  if(!exposed) {
    art.lineStyle(2,0x96cbff,.67).strokeEllipse(scene.boss.x,scene.boss.y,170,110);
    art.lineStyle(5,0x6fafff,.13).strokeEllipse(scene.boss.x,scene.boss.y,177,115);
  } else {
    art.lineStyle(2,color,.65).lineBetween(x,y-30,scene.boss.x,scene.boss.y+28);
  }
}

export function restoreStation(scene) {
  scene.relayArt.clear();
  for(let i=0;i<18;i++) {
    const bank=scene.add.graphics().setDepth(.1).setAlpha(0);
    for(const y of [28,505]) {
      for(let j=0;j<3;j++)bank.fillStyle(j===1?0xffdb99:0xa8ffea).fillRoundedRect(36+i*50+j*8,y,5,9,1);
    }
    scene.tweens.add({targets:bank,alpha:1,duration:260,delay:i*46,ease:'Sine.Out'});
  }
}

export function signatureCue(scene,attack,ratio,color) {
  const a=scene.warning, {x,y}=attack;
  const id=scene.planet==='earthDefense'?echoStyles[attack.type][2]:scene.planet;
  a.lineStyle(2,color,.8);
  if (id==='uranus') {
    for(let i=0;i<8;i++){
      const theta=i*Math.PI/4, r=attack.radius, l=r*(.22+.70*ratio);
      const dx=Math.cos(theta),dy=Math.sin(theta),kink=(i%2?1:-1)*8;
      const sx=x+r*dx,sy=y+r*dy,mx=sx-dx*l*.5-dy*kink,my=sy-dy*l*.5+dx*kink;
      a.lineBetween(sx,sy,mx,my).lineBetween(mx,my,sx-dx*l,sy-dy*l);
    }
  } else if(id==='venus'){
    for(let i=0;i<9;i++){
      const theta=i*2.4,r=15+i*3.5;
      a.strokeCircle(x+Math.cos(theta)*r,y+Math.sin(theta)*r,2+((ratio*10+i)%6));
    }
    a.fillStyle(color,.5).fillEllipse(scene.boss.x,scene.boss.y+32,13+ratio*18,10+ratio*12);
  } else if(id==='mercury'||id==='mars'){
    for (const angle of attack.angles) {
      const reach=26+ratio*35;
      a.fillStyle(color,.75).fillCircle(scene.boss.x+Math.cos(angle)*reach,scene.boss.y+Math.sin(angle)*reach,2+ratio*3);
    }
  } else if(id==='saturn'){
    for(const angle of attack.angles){
      const r=42+ratio*28;
      a.lineBetween(scene.boss.x+r*Math.cos(angle),scene.boss.y+r*Math.sin(angle),
        scene.boss.x+(r+10)*Math.cos(angle),scene.boss.y+(r+10)*Math.sin(angle));
    }
  }
}

// End poses and debris follow the silhouette and material of each guardian.
const motion={
  mars:[-13,8,0,34], jupiter:[5,-9,0,-22], saturn:[14,-3,50,5],
  uranus:[-4,9,-11,28], neptune:[-12,-4,-36,17], venus:[5,6,6,24],
  mercury:[8,-11,47,-34], earthDefense:[-6,-6,90,0]
};
export function recoil(scene,age) {
  const [angle,offset]=motion[scene.planet], t=Math.max(0,1-age/180);
  scene.bossCore.setAngle(angle*t*t);
  return offset*t*t;
}
export function dissipate(scene) {
  const {x,y}=scene.boss, color=scene.warden.highlight;
  const [, ,turn, fall]=motion[scene.planet];
  scene.tweens.add({targets:scene.bossCore,y:y+fall,angle:turn,scaleX:.42,scaleY:.25,alpha:0,duration:470,ease:'Quad.In'});
  scene.tweens.add({targets:scene.boss,alpha:0,duration:300});
  if(scene.planet==='jupiter')restoreStation(scene);
  for(let i=0;i<12;i++){
    const theta=i*Math.PI/6,r=46+(i%4)*11;
    const p=scene.planet==='saturn'||scene.planet==='neptune'
      ?scene.add.circle(x,y,3+i%4).setStrokeStyle(2,color)
      :scene.add.triangle(x,y,0,0,5+i%5,2,3,12+i%5,color);
    p.setDepth(3);
    scene.tweens.add({targets:p,x:x+r*Math.cos(theta),y:y+r*Math.sin(theta)+fall,angle:turn*3+i*11,
      alpha:0,duration:540+i*15,ease:'Quad.Out',onComplete:()=>p.destroy()});
  }
}
