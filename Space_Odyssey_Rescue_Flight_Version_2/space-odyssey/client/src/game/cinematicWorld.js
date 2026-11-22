import * as T from 'three';
import skyMap from '../assets/orbits/deep-sky.webp';
import faults from '../assets/orbits/earth-faults.webp';
import earth from '../assets/orbits/earth.webp';
import mars from '../assets/orbits/mars.webp';
import jupiter from '../assets/orbits/jupiter.webp';
import saturn from '../assets/orbits/saturn.webp';
import uranus from '../assets/orbits/uranus.webp';
import neptune from '../assets/orbits/neptune.webp';
import venus from '../assets/orbits/venus.webp';
import mercury from '../assets/orbits/mercury.webp';
import earthDefense from '../assets/orbits/earthDefense.webp';
import { makeShuttle } from './FlightView.js';

const maps = {earth, mars, jupiter, saturn, uranus, neptune, venus, mercury, earthDefense};
const rims = {earth:0x47a5ff, earthDefense:0x779cdd, mars:0xd68b63, venus:0xffdf8a,
  jupiter:0xffcc95, saturn:0xffdc9a, uranus:0x61f4da, neptune:0x537fff};

export function randomSource(seed) {
  return () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296);
}

export function world() {
  const scene = new T.Scene();
  scene.background = new T.Color(0x050916);
  const camera = new T.PerspectiveCamera(42,16/9,.1,900);
  const sun = new T.DirectionalLight(0xffedde,2.45);
  sun.position.set(-8,6,5);
  scene.add(sun,new T.HemisphereLight(0xafc8df,0x44506b,.48));
  const rim = new T.DirectionalLight(0x8cbfff,1.18);
  rim.position.set(3,2,-6); scene.add(rim);

  const positions=[], colors=[], random=randomSource(633);
  for (let i=0;i<1200;i++) {
    const phi=random()*Math.PI*2, y=random()*2-1, ring=Math.sqrt(1-y*y);
    positions.push(360*ring*Math.cos(phi),360*y,360*ring*Math.sin(phi));
    const intensity=.2+.8*random()**3;
    colors.push(intensity*(.72+.28*random()),intensity*.88,intensity);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const stars = new T.Points(geometry,new T.PointsMaterial({vertexColors:true,size:1.15,sizeAttenuation:false,fog:false}));
  const skyTexture=new T.TextureLoader().load(skyMap);skyTexture.colorSpace=T.SRGBColorSpace;
  const sky=new T.Mesh(new T.SphereGeometry(430,32,20),new T.MeshBasicMaterial({map:skyTexture,side:T.BackSide,depthWrite:false,fog:false}));
  sky.rotation.set(.25,.1,.54);sky.renderOrder=-3;
  sky.add(stars);scene.add(sky);
  return {scene,camera,sun,sky};
}

function bands(group, tilt) {
  // Concentric radial color and opacity detail, with an open Cassini division.
  const size=384, data=new Uint8Array(size*4), random=randomSource(47);
  for (let i=0;i<size;i++) {
    const t=i/(size-1);
    const value=.67+.16*Math.sin(t*69)+.08*Math.sin(t*199)+random()*.10;
    const opacity=t<.16 ? .18+.9*t : (t>.64 && t<.692 ? .07 : .82);
    data.set([235*value,210*value,170*value,Math.min(255,255*opacity)],i*4);
  }
  const map=new T.DataTexture(data,size,1);
  map.colorSpace=T.SRGBColorSpace; map.magFilter=T.LinearFilter; map.needsUpdate=true;
  const geometry=new T.RingGeometry(1.24,2.22,160,4), uv=geometry.attributes.uv, pos=geometry.attributes.position;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(Math.hypot(pos.getX(i),pos.getY(i))-1.24)/.98,.5);
  const ring=new T.Mesh(geometry,new T.MeshBasicMaterial({map,side:T.DoubleSide,transparent:true,depthWrite:false}));
  ring.rotation.set(1.17,.08,0);
  const plane=new T.Group();plane.rotation.z=tilt;plane.add(ring);group.add(plane);
}

export function planet(id) {
  const group = new T.Group();
  const map = new T.TextureLoader().load(maps[id]);
  map.colorSpace=T.SRGBColorSpace; map.wrapS=T.RepeatWrapping;
  const mat = new T.MeshStandardMaterial({map, roughness:.94, metalness:0});
  if(id==='earthDefense'){
    mat.emissiveMap=new T.TextureLoader().load(faults);mat.emissiveMap.colorSpace=T.SRGBColorSpace;
    mat.emissive.set(0xffdbad);mat.emissiveIntensity=1.35;
  }
  const sphere=new T.Mesh(new T.SphereGeometry(1,80,48),mat);
  sphere.rotation.y = id==='earth' || id==='earthDefense' ? -1.08 : 2.1;
  sphere.rotation.z = {mars:.08,uranus:1.04,jupiter:-.1,saturn:.2,neptune:.15}[id] ?? -.10;
  group.add(sphere);
  if(rims[id]) {
    const atmosphere=new T.ShaderMaterial({
      uniforms:{tone:{value:new T.Color(rims[id])}},
      vertexShader:'varying vec3 n; varying vec3 eye; void main(){vec4 p=modelViewMatrix*vec4(position,1.);eye=-p.xyz;n=normalMatrix*normal;gl_Position=projectionMatrix*p;}',
      fragmentShader:'uniform vec3 tone; varying vec3 n; varying vec3 eye; void main(){float edge=pow(1.-abs(dot(normalize(n),normalize(eye))),4.7);gl_FragColor=vec4(tone,min(.50,edge*.58));}',
      transparent:true,depthWrite:false,blending:T.AdditiveBlending
    });
    const shell=new T.Mesh(sphere.geometry,atmosphere);shell.scale.setScalar(1.006);group.add(shell);
  }
  if(id==='saturn')bands(group,.22);
  return {group,sphere};
}

export function glow(color, size, sharp=false) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(sharp ? .24 : .08,'rgba(255,255,255,.97)');
  gradient.addColorStop(sharp ? .255 : .24,'rgba(255,255,255,.48)');
  gradient.addColorStop(.53,'rgba(255,255,255,.13)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  sprite.scale.set(size,size,1);return sprite;
}

export function shuttle() {
  const model=makeShuttle();
  for(const side of [-1,1]){
    const flare=glow(0x9cddff,1.22);flare.position.set(side*.81,0,1.42);model.add(flare);
  }
  return model;
}

export function scatter(group, count, seed, palette, spread) {
  const random=randomSource(seed), dummy=new T.Object3D(), rock=new T.IcosahedronGeometry(1,1);
  const mesh=new T.InstancedMesh(rock,new T.MeshStandardMaterial({roughness:1,flatShading:true}),count);
  for(let i=0;i<count;i++){
    spread(dummy.position,random,i);
    const size=.2+random()**2*1.15;
    dummy.scale.set(size*(.65+random()*.6),size*(.6+random()*.7),size);
    dummy.rotation.set(random()*5,random()*5,random()*5);dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color(palette[i%palette.length]));
  }
  group.add(mesh);return mesh;
}

export function releaseWorld(scene) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene.traverse(obj=>{
    if(obj.geometry)geometries.add(obj.geometry);
    if(obj.material)for(const mat of [].concat(obj.material)) materials.add(mat);
    if(obj.isInstancedMesh)obj.dispose();
  });
  for(const mat of materials) {
    for (const value of Object.values(mat)) if(value?.isTexture)textures.add(value);
    mat.dispose();
  }
  for(const tex of textures)tex.dispose();
  for(const geometry of geometries)geometry.dispose();
}
