import * as T from 'three';
import regolith from '../assets/orbits/regolith.webp';
import mist from '../assets/orbits/vapor.webp';
import { metal,piece,ringkeeper } from './orbitalModels.js';
import { glow,randomSource,scatter } from './cinematicWorld.js';

function line(parent, points, color, opacity=1) {
  const path=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));
  const stroke=new T.Line(path,new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));
  parent.add(stroke);return stroke;
}

export function outpost(damaged=false) {
  const dock = new T.Group(), box=new T.BoxGeometry(), cylinder=new T.CylinderGeometry(1,1,1,16);
  const ceramic=metal(0xb9c2bd),iron=metal(0x495765),blue=metal(0x254375),brass=metal(0xba9959);
  const panel=new T.Group();dock.add(panel);panel.rotation.z=damaged?-.32:.07;
  piece(dock,cylinder,ceramic,0,0,0,1.05,4.3,1.05).rotation.z=Math.PI*.5;
  for(let i=-2;i<=2;i++)piece(dock,cylinder,iron,i*.75,0,0,1.1,.11,1.1).rotation.z=Math.PI*.5;
  piece(panel,box,ceramic,0,.15,0,13,.13,.16);
  for (const side of [-1,1]) {
    if(damaged && side===1)continue;
    for(let i=0;i<3;i++){
      const x=side*(2.7+i*1.35);
      piece(panel,box,blue,x,.18,0,1.24,.09,2.8);
      for(let k=0;k<5;k++)piece(panel,box,brass,x,.24,-1.30+k*.65,1.26,.023,.035);
    }
  }
  const dish=piece(dock,new T.SphereGeometry(1,24,10,0,Math.PI*2,0,.95),ceramic,.5,1,0,.85,.38,.85);
  dish.rotation.z=-.48;
  piece(dock,box,iron,.85,1.48,0,.06,1.05,.06).rotation.z=-.48;
  const lamp=glow(damaged?0xff984e:0x85fff2,.76);lamp.position.set(2.16,.25,.34);dock.add(lamp);
  return dock;
}

function terrain(kind) {
  const group=new T.Group(), red=kind==='mars', random=randomSource(red?78:12);
  const g=new T.PlaneGeometry(122,105,100,88);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,colors=[],color=new T.Color();
  const craters=Array.from({length:25},()=>[random()*110-55,random()*92-50,1.2+random()*5]);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), z=p.getZ(i), f=Math.sin(x*1.8+z*.91)*.16+Math.cos(x*.71-z*.45)*.23;
    let h=f;
    if(red){
      const wall=Math.max(0, Math.abs(x-3.6*Math.sin(z*.105))-4);
      const layers=Math.min(9,wall*.70+1.35*Math.sin(z*.25+x*.09));
      h+=Math.floor(Math.max(0,layers)*1.85)/1.85+.38*Math.sin(z*.55);
    }else{
      for(const [cx,cz,r] of craters){
        const d=Math.hypot(x-cx,z-cz)/r;
        if(d<1.5)h+=r*(.23*Math.exp(-((d-1)**2)/.044)-.24*Math.max(0,1-d*d));
      }
    }
    p.setY(i,h);
    color.set(red?0xaa563b:0x88857f).multiplyScalar(.74+.14*Math.sin(h*4+f)+.035*h+.05*random());
    colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const map=new T.TextureLoader().load(regolith);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(14,14);
  group.add(new T.Mesh(g,new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.18,vertexColors:true,roughness:1})));
  return group;
}

function ribbon(parent, vertices, color, opacity) {
  const positions=[],indices=[],uv=[];
  vertices.forEach(([x,y,z,height],i)=>{
    positions.push(x,y,z,x,y+height,z);uv.push(i/(vertices.length-1),0,i/(vertices.length-1),1);
    if(i){const a=2*i;indices.push(a-2,a-1,a,a,a-1,a+1);}
  });
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const mesh=new T.Mesh(g,new T.ShaderMaterial({
    uniforms:{tone:{value:new T.Color(color)},intensity:{value:opacity*2.6}},
    vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 coord;uniform vec3 tone;uniform float intensity;void main(){float curtain=.23+.77*pow(.5+.5*sin(coord.x*218.+4.*sin(coord.x*36.)),2.);float fade=pow(1.-coord.y,1.8)*smoothstep(0.,.09,coord.y);gl_FragColor=vec4(tone,intensity*curtain*fade);}',
    transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending
  }));
  parent.add(mesh);return mesh;
}

export function landmark(id) {
  const group=new T.Group(), motion=[];
  const box=new T.BoxGeometry(), cyl=new T.CylinderGeometry(1,1,1,20), sphere=new T.SphereGeometry(1,18,12);
  const steel=metal(0x6a7a83), ivory=metal(0xc2beb1), gold=metal(0xc59c66);
  const deck=()=>piece(group,cyl,steel,0,-.45,0,5.4,.72,5.4);
  function rim(radius, material, y, thickness=.065) {
    const mesh=piece(group,new T.TorusGeometry(radius,thickness,7,72),material,0,y,0);
    mesh.rotation.x=Math.PI/2;return mesh;
  }
  if(id==='earth'||id==='earthDefense'){
    const broken=id==='earthDefense', station=outpost(broken);group.add(station);
    station.scale.setScalar(1.15);
    if(broken)scatter(group,26,91,[0x9c8270,0x767985],(p,r)=>p.set(4+r()*10,(r()-.4)*8,(r()-.6)*11));
    motion.push(t=>{station.rotation.y=t*.055-.35;});
  }else if(id==='saturn'){
    deck();rim(4.85,gold,-.05);rim(3.25,gold,-.03);rim(1.85,gold,-.01);
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8;
      piece(group,box,ivory,Math.cos(a)*5.17,-.15,Math.sin(a)*5.17,.19,.35,.49).rotation.y=-a;
    }
    const keeper=ringkeeper();keeper.body.scale.setScalar(1.38);keeper.body.position.y=1.0;
    group.add(keeper.body);motion.push(t=>{keeper.rotor.rotation.y=t*.65;});
  }else if(id==='mars'||id==='mercury'){
    group.add(terrain(id));
    const drone=outpost();drone.scale.setScalar(.35);drone.position.set(id==='mars'?-1.5:3,.95,-7);group.add(drone);
    if(id==='mercury'){
      for(let i=0;i<4;i++){
        const x=-7+i*3.1,stand=piece(group,cyl,steel,x,.8,-10, .12,2.6,.12);
        const mirror=piece(group,box,gold,x,2.25,stand.position.z,2.65,.13,3.6);mirror.rotation.z=-.64;
      }
    }
  }else if(id==='jupiter'){
    deck();rim(4.9,gold,-.04);
    for(let i=0;i<3;i++){
      const x=(i-1)*2.8,z=i===1?-2.4:.8;
      piece(group,new T.CylinderGeometry(.16,.60,4.4,8),ivory,x,2,z);
      for(let j=0;j<5;j++)piece(group,cyl,gold,x,2+j*.37,z,.55-j*.038,.12,.55-j*.038);
      const bulb=glow(0x96eaff,1);bulb.position.set(x,4.3,z);group.add(bulb);
    }
    const arcs=[];
    for(const side of [-1,1])arcs.push(line(group,[[0,4.2,-2.4],[side*.85,4.54,-2],[side*.66,4.28,-1.3],[side*1.9,4.55,-.55],[side*1.68,4.23,0],[side*2.8,4.24,.8]],0x9be9ff,.85));
    motion.push(t=>arcs.forEach((a,i)=>{a.material.opacity=.40+.45*(.5+.5*Math.sin(t*3+i));}));
  }else if(id==='uranus'){
    const ice=metal(0x85d5df,0x10414a);
    const crystal=new T.LatheGeometry([new T.Vector2(.72,-.5),new T.Vector2(.82,.19),new T.Vector2(.07,.59)],6);
    const random=randomSource(541);
    for(let i=0;i<26;i++){
      const x=(random()-.5)*12,z=(random()-.5)*8,h=1.3+random()*4.5;
      piece(group,crystal,ice,x,h/2-1.5,z,.38+random()*.5,h,.6).rotation.z=(random()-.5)*.46;
    }
    for(let j=0;j<4;j++){
      const verts=Array.from({length:95},(_,i)=>{const x=i*.40-19;return [x,4.3+Math.sin(x*.31+j*.32),-7+Math.sin(x*.4)*2+j*.6,1+1.2*Math.sin(x*.25+.7)**2];});
      const veil=ribbon(group,verts,j%2?0x7b9bff:0x62ffe0,.13);
      motion.push(t=>{veil.position.y=Math.sin(t*.55+j*.4)*.30;});
    }
  }else if(id==='venus'){
    deck();rim(4.9,gold,-.04);
    for(const [x,z,s] of [[-2,-1,1.10],[.1,-2,1.45],[2.3,0,.83]]){
      piece(group,cyl,ivory,x,1.05,z,s,2.2,s);
      piece(group,sphere,gold,x,2.14,z,s,.52,s);
      piece(group,cyl,steel,x,2.9,z,.21,1.35,.21);
      for(let i=0;i<3;i++)piece(group,cyl,gold,x,.35+i*.65,z,s*1.03,.12,s*1.03);
      const vapor=glow(0xdac780,2.7);vapor.material.opacity=.37;
      group.add(vapor);motion.push(t=>{vapor.position.set(x+Math.sin(t*.6+z)*.38,4+.24*Math.cos(t+z),z);});
    }
    const vaporMap=new T.TextureLoader().load(mist);vaporMap.colorSpace=T.SRGBColorSpace;
    const random=randomSource(808);
    for(let i=0;i<26;i++){
      const cloud=new T.Sprite(new T.SpriteMaterial({map:vaporMap,color:i%3?0xe9d290:0xc0ab75,transparent:true,opacity:.58,depthWrite:false}));
      const x=(random()-.5)*31,z=(random()-.65)*23,y=-1.8-random()*2.5,size=5+random()*5;
      cloud.position.set(x,y,z);cloud.scale.set(size*1.6,size*.53,1);group.add(cloud);
      motion.push(t=>{cloud.position.x=x+t*.15;});
    }
    for(const side of [-1,1]){
      piece(group,new T.TorusGeometry(1.14,.20,8,30,Math.PI),gold,side*1.1,.56,1.1);
    }
  }else if(id==='neptune'){
    // Open turbine blades and an intake ring frame the storm below the relay.
    const turbines=new T.Group();group.add(turbines);
    for(let i=0;i<6;i++){
      const arm=new T.Group();arm.rotation.z=i*Math.PI/3;turbines.add(arm);
      const blade=piece(arm,box,ivory,0,1.65,0,.74,2.85,.20);blade.rotation.y=.51;blade.rotation.z=-.27;
    }
    piece(group,new T.TorusGeometry(3.22,.17,10,72),steel,0,0,0);
    piece(group,sphere,gold,0,0,.03,.58,.58,.65);
    for(const r of [2.91,3.43])piece(group,new T.TorusGeometry(r,.065,6,70),ivory,0,0,.19);
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8,mount=piece(group,box,i%4?steel:gold,3.17*Math.cos(a),3.17*Math.sin(a),.12,.53,.14,.30);
      mount.rotation.z=a;
    }
    for(const side of [-1,1])piece(group,box,steel,side*2.3,-2.8,0,.28,2.1,.50).rotation.z=side*.23;
    motion.push(t=>{turbines.rotation.z=-t*.32;});
    for(let j=0;j<3;j++){
      const arc=Array.from({length:85},(_,i)=>{const a=i*.036+j*1.4,r=5+i*.047;return [Math.cos(a)*r,Math.sin(a)*r,-2-i*.03];});
      line(group,arc,0x80bdff,.30);
    }
  }
  return {group,update:t=>motion.forEach(fn=>fn(t))};
}
