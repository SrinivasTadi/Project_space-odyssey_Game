function glow(scene,key,color) {
  const texture=scene.textures.createCanvas(key,192,192);
  const ctx=texture.context, gradient=ctx.createRadialGradient(96,96,0,96,96,96);
  gradient.addColorStop(0,'rgba('+color+',.9)');
  gradient.addColorStop(.3,'rgba('+color+',.50)');
  gradient.addColorStop(1,'rgba('+color+',0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,192,192);texture.refresh();
  return scene.add.image(0,0,key).setDepth(-.12).setBlendMode('ADD');
}

export function setupJupiterLights(scene) {
  const amber=glow(scene,'relay-light','255,164,52'), blue=glow(scene,'core-light','62,183,253');
  const reflection=scene.add.graphics().setDepth(-.11);
  const source=scene.textures.get('guardian').getSourceImage();
  const armor=['244,163,60','90,190,255'].map((color,i)=>{
    const key='pilot-reflection-'+i, tex=scene.textures.createCanvas(key,source.width,source.height);
    const ctx=tex.context;
    ctx.drawImage(source,0,0);
    ctx.globalCompositeOperation='source-in';
    const tint=ctx.createLinearGradient(0,0,source.width,source.height);
    tint.addColorStop(0,'rgba('+color+',.95)');tint.addColorStop(.60,'rgba('+color+',.28)');
    tint.addColorStop(1,'rgba('+color+',0)');ctx.fillStyle=tint;ctx.fillRect(0,0,source.width,source.height);
    tex.refresh();
    return scene.add.image(0,0,key).setDepth(3.15).setBlendMode('ADD');
  });
  function update(time) {
    const {boss,relay,player,pilotSprite,pendingAttack}=scene;
    const exposed=time<scene.exposedUntil;
    const locked=pendingAttack?.columns.some(x=>Math.abs(x-relay.x)<53);
    const charge=locked?Math.min(1,(time-pendingAttack.started)/scene.warden.telegraph):0;
    const warm = exposed ? .07 : .23 + .74 * charge;
    const cool = exposed ? .9 : .08;
    amber.setPosition(relay.x,relay.y+6).setDisplaySize(300+160*charge,135+55*charge).setAlpha(warm);
    blue.setPosition(boss.x,boss.y+36).setDisplaySize(340,152).setAlpha(cool);
    reflection.clear();
    for(let i=0;i<6;i++){
      reflection.lineStyle(2,0xffc273,warm*(.40-i*.04)).lineBetween(relay.x-18+i*6,relay.y+15,relay.x-42+i*9,relay.y+58+i*3);
      reflection.lineStyle(2,0x8edfff,cool*(.36-i*.035)).lineBetween(boss.x-21+i*7,boss.y+52,boss.x-37+i*11,boss.y+89+i*2);
    }
    if(pilotSprite) {
      for(const [index,lamp] of armor.entries()){
        const light=index===0?relay:boss;
        const distance=Math.hypot(player.x-light.x,player.y-light.y);
        lamp.setPosition(pilotSprite.x,pilotSprite.y).setRotation(pilotSprite.rotation)
          .setDisplaySize(pilotSprite.displayWidth,pilotSprite.displayHeight).setFlipX(pilotSprite.flipX)
          .setAlpha(Math.max(0,1-distance/350)*(index===0?warm:cool)*pilotSprite.alpha);
      }
    }
  }
  return {update, clear(){for(const item of [amber,blue,reflection,...armor])item.setVisible(false);}};
}

const plateOutline=[[5,41],[11,33],[16,24],[26,21],[35,27],[38,39],[46,43],[43,54],[36,65],[19,68],[5,60]];
function tracePlate(ctx) {
  ctx.beginPath();plateOutline.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
}

export function setupMarsArmor(scene) {
  const source=scene.textures.get('battle-cast').getSourceImage();
  const plate=scene.textures.createCanvas('mars-loose-plate',48,55), ctx=plate.context;
  ctx.save();ctx.translate(0,-17);tracePlate(ctx);ctx.clip();ctx.drawImage(source,0,0);ctx.restore();plate.refresh();
  for(const broken of [false,true]){
    const texture=scene.textures.createCanvas(broken?'mars-open':'mars-cracked',152,152);
    const c=texture.context;c.drawImage(source,0,0,152,152,0,0,152,152);
    c.save();tracePlate(c);c.clip();c.globalCompositeOperation='source-atop';
    if(broken){
      c.fillStyle='#29242b';c.fillRect(0,0,52,72);
      for(let y=26;y<68;y+=7){
        c.fillStyle='#746c63';c.fillRect(10,y,30,3);
        c.fillStyle='#f28b42';c.fillRect(17,y,12,2);
      }
      c.strokeStyle='#ffa057';c.lineWidth=2;c.beginPath();c.arc(25,46,11,0,Math.PI*2);c.stroke();
    } else {
      c.lineWidth=3;c.strokeStyle='#291920';c.beginPath();c.moveTo(37,28);
      for(const [x,y] of [[28,38],[31,44],[19,49],[22,53],[12,61]])c.lineTo(x,y);
      c.stroke();c.lineWidth=1;c.strokeStyle='#ffd092';c.stroke();
    }
    c.restore();texture.refresh();
  }
  let level=0;
  return ()=>{
    const ratio=scene.bossHealth/scene.warden.hp;
    const next=ratio<=1/3?2:ratio<=2/3?1:0;
    if(next<=level)return;
    level=next;scene.bossCore.setTexture(next===2?'mars-open':'mars-cracked');
    if(next===2){
      const {x,y}=scene.bossCore;
      const chip=scene.add.image(x-52,y-34,'mars-loose-plate').setDepth(.8);
      scene.tweens.add({targets:chip,x:x-135,angle:-94,duration:850,ease:'Quad.Out'});
      scene.tweens.add({targets:chip,y:y-65,duration:160,ease:'Quad.Out',onComplete:()=>{
        scene.tweens.add({targets:chip,y:y+69,duration:690,ease:'Bounce.Out'});
      }});
    }
  };
}
