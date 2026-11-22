import * as T from 'three';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';

export function createRenderer(width, height, allowSVG = true) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  } catch {
    if (!allowSVG) return null;
    renderer = new SVGRenderer();
    renderer.setQuality('low');
  }
  renderer.setSize(width, height, false);
  return renderer;
}

export function studioLight(scene) {
  scene.add(new T.HemisphereLight(0xffe9cc, 0x536b85, 2.1));
  for (const [position, color, intensity] of [
    [[-4,6,4],0xffe7b3,3], [[4,1,-3],0x8ac5ff,2.8]
  ]) {
    const light = new T.DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  }
}

export function disposeScene(scene, renderer) {
  const geometries = new Set(), materials = new Set();
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) materials.add(object.material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  renderer.dispose?.();
  renderer.forceContextLoss?.();
  renderer.domElement.remove();
}

export function metal(color, glow = 0) {
  return new T.MeshStandardMaterial({color, metalness:.56, roughness:.36,
    emissive:glow, emissiveIntensity:.85});
}

export function piece(parent, geometry, material, x, y, z, sx=1, sy=1, sz=1) {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); parent.add(mesh);
  return mesh;
}

export function ringkeeper() {
  const body = new T.Group(), rings = new T.Group(), rotor = new T.Group();
  const shell=metal(0xbf7940), dark=metal(0x28323a), brass=metal(0xf2bc6c);
  const lamp=metal(0xffce62,0xffa72c), sphere=new T.SphereGeometry(1,18,12);
  const box = new T.BoxGeometry(), pin = new T.ConeGeometry(1,1,5);
  piece(body,sphere,dark,0,0,0,.65,.64,.72);
  for(const side of [-1,1]){
    const pauldron=piece(body,sphere,shell,side*.34,.22,-.02,.38,.74,.65);
    pauldron.rotation.z=side*-.25;
    for(let i=0;i<3;i++){
      const limb=piece(body,box,brass,side*(.67+.07*i),-.13-.09*i,.35-i*.34,.48,.11,.18);
      limb.rotation.z=side*(.18+i*.16);
    }
    const claw=piece(body,pin,shell,side*.72,-.36,.58,.20,.7,.21);
    claw.rotation.x=1.35;
    piece(body,sphere,lamp,side*.20,.22,.75,.12,.055,.055);
  }
  piece(body,sphere,dark,0,.11,.62,.43,.28,.25);
  piece(body,sphere,lamp,0,-.08,.8,.14,.1,.08);
  body.add(rings); rings.add(rotor);
  for(const [r,w,mat] of [[1.14,.055,brass],[1.32,.023,lamp],[1.38,.038,dark]]){
    const rim=piece(rotor,new T.TorusGeometry(r,w,6,64),mat,0,0,0);
    rim.rotation.x=Math.PI/2;
  }
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const bridge=piece(rotor,box,i%3?brass:lamp,Math.cos(a)*1.25,0,Math.sin(a)*1.25,.28,.07,.08);
    bridge.rotation.y=-a;
  }
  return {body,rings,rotor};
}

// A small live render target shares the Phaser sprite's position, hitbox and defeat tween.
export function attachRingkeeper(scene) {
  const renderer=createRenderer(192,192,false);
  if(!renderer)return null;
  const world=new T.Scene(), camera=new T.OrthographicCamera(-1.70,1.70,1.70,-1.70,.1,30);
  camera.position.set(.12,2.35,5);camera.lookAt(0,0,0);
  studioLight(world);
  const model=ringkeeper();world.add(model.body);
  const texture=scene.textures.createCanvas('saturn-live',192,192);
  scene.bossCore.setTexture('saturn-live');
  const shadow=scene.add.ellipse(480,168,145,32,0x111220,.42).setDepth(.3);
  const stripe=scene.add.ellipse(480,168,145,32).setStrokeStyle(4,0x32202a,.58).setDepth(.31);
  const notches=scene.add.graphics().setDepth(.32);
  let last=-Infinity, bearing=0;
  const draw=(time)=>{
    if(time-last<24)return;
    last=time;
    const target=scene.pendingAttack;
    if(target) bearing=target.angles[0];
    const pose=scene.mechanismPose;
    model.rings.rotation.set(.16+pose*.77,.05,Math.cos(bearing)*pose*.70);
    model.rotor.rotation.y=target ? -bearing : time*.00063;
    model.body.rotation.y=Math.sin(time*.0007)*.20;
    shadow.setPosition(scene.boss.x+8,scene.boss.y+47);
    stripe.setPosition(shadow.x,shadow.y).setRotation(Math.cos(bearing)*pose*.42)
      .setDisplaySize(144,22+pose*26);
    notches.clear();
    if (target) {
      // Each mark points along the trajectory of an actual ring fragment.
      for (const angle of target.angles) {
        const dx = Math.cos(angle), dy = Math.sin(angle);
        notches.lineStyle(5,0x271d25,.52).lineBetween(shadow.x+dx*63,shadow.y+dy*30,
          shadow.x+dx*(73+pose*17),shadow.y+dy*(40+pose*17));
        notches.lineStyle(1.5,0xffde99,pose*.8).lineBetween(shadow.x+dx*65,shadow.y+dy*32,
          shadow.x+dx*(71+pose*17),shadow.y+dy*(38+pose*17));
      }
    }
    renderer.render(world,camera);
    texture.context.clearRect(0,0,192,192);
    texture.context.drawImage(renderer.domElement,0,0);
    texture.refresh();
  };
  draw(0);
  return {draw, shadows:[shadow,stripe,notches], dispose:()=>disposeScene(world,renderer)};
}
