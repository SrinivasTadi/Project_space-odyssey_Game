import * as T from 'three';
import { world,planet,shuttle,glow,scatter,randomSource } from './cinematicWorld.js';
import { outpost } from './arrivalSites.js';
import { piece,metal } from './orbitalModels.js';

function gatePass(scene,camera,ship) {
  const path=new T.CatmullRomCurve3([
    [0,0,0],[2,1,-21],[-3,3,-44],[-7,-2,-68],[4,-3,-96],[8,1,-124],[3,3,-158],[0,1,-190]
  ].map(v=>new T.Vector3(...v)));
  const material=new T.ShaderMaterial({
    side:T.BackSide,uniforms:{clock:{value:0}},
    vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`
      varying vec2 coord; uniform float clock;
      void main(){
        float a=coord.y*6.2831853, z=coord.x;
        float bend=sin(z*13.-clock*.24)*1.3+sin(z*26.+a*2.)*.21;
        float field=sin(a*4.+bend-z*15.)+.48*sin(a*11.+z*33.+bend*2.);
        float mist=.5+.5*sin(3.*a+19.*z+2.*sin(6.*a+26.*z)+sin(17.*a-z*42.));
        float veins=pow(max(0.,1.-abs(sin(a*22.+z*74.+field*3.))),4.);
        float waves=pow(.5+.5*sin(z*143.-clock*2.5+a*2.+field*.8),7.);
        float streak=pow(.5+.5*cos(a*49.+z*28.+bend*4.),17.);
        vec3 col=mix(vec3(.025,.045,.12),vec3(.13,.13,.38),.5+.5*field*.64);
        col=col*.64+vec3(.075,.11,.19)*mist*mist;col+=vec3(.10,.36,.46)*veins*mist + vec3(.17,.18,.37)*waves*.29;
        col+=mix(vec3(.18,.55,.72),vec3(.72,.34,.10),.5+.5*sin(a*3.+z*13.))*streak*(.38+.61*mist);
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`
  });
  const tube=new T.Mesh(new T.TubeGeometry(path,148,8,64,false),material);
  scene.add(tube);
  const beacon=glow(0xffdfab,19,true);path.getPointAt(1,beacon.position);scene.add(beacon);
  const random=randomSource(90),points=[];
  for(let i=0;i<220;i++){
    const depth=random(), p=path.getPointAt(depth),angle=random()*Math.PI*2,rad=4.8+random()*2;
    p.x+=Math.cos(angle)*rad;p.y+=Math.sin(angle)*rad;points.push(p.x,p.y,p.z,p.x+.02,p.y,p.z-1-random()*2);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));
  scene.add(new T.LineSegments(g,new T.LineBasicMaterial({color:0x96c5ef,transparent:true,opacity:.53})));
  const ahead=new T.Vector3(), look=new T.Vector3(), right=new T.Vector3(),up=new T.Vector3(0,1,0);
  ship.scale.setScalar(.55);
  return t=>{
    const depth=.015+.80*t;
    path.getPointAt(depth,camera.position);
    path.getPointAt(depth+.069,ahead);camera.lookAt(ahead);camera.rotateZ(.07*Math.sin(t*6));
    path.getPointAt(depth+.035,ship.position);
    path.getTangentAt(depth,right).cross(up).normalize();
    ship.position.addScaledVector(right,1.1*Math.sin(t*6.3)-.65);ship.position.y-=.86;
    path.getTangentAt(depth,look);ship.quaternion.setFromUnitVectors(forward,look);
    ship.rotateZ(.22*Math.sin(t*8));material.uniforms.clock.value=t*5;
  };
}
const forward=new T.Vector3(0,0,-1);

export function voyageScene(id) {
  const {scene,camera,sun}=world(),ship=shuttle();
  scene.add(ship);
  if(id==='gate')return {scene,camera,draw:gatePass(scene,camera,ship)};
  const body={escape:'earthDefense',rings:'saturn',blue:'neptune'}[id];
  const globe=body?planet(body):null;
  if(globe)scene.add(globe.group);
  const station=id==='escape'||id==='binary'?outpost(id==='binary'):null;
  if(station)scene.add(station);
  let ice,buoy,signal;
  let fragments;
  if(id==='rings'){
    fragments=new T.Group();scene.add(fragments);
    scatter(fragments,110,502,[0xa49d91,0xe5dcc3,0xaaa9aa],(p,r)=>{
      const x=(r()-.5)*76;p.set(x,-3.8+x*.055+r()*.38,-58+r()*54);
    }).scale.setScalar(.83);
  }
  if(id==='buoy'){
    ice=new T.Group();scene.add(ice);
    scatter(ice,186,209,[0x7c94aa,0x9aa8ad,0xb1beb9,0x646d83],(p,r)=>{
      const side=r()>.5?1:-1; p.set(side*(4+r()**1.4*28),(r()-.49)*19,12-r()*100);
    });
    buoy=new T.Group();scene.add(buoy);
    piece(buoy,new T.OctahedronGeometry(1,0),metal(0xbd9c55),0,0,0,.62,.92,.62);
    piece(buoy,new T.BoxGeometry(),metal(0x788894),0,0,0,2.1,.11,.53);
    piece(buoy,new T.CylinderGeometry(.035,.044,1.5),metal(0xced3cc),0,1.1,0);
    signal=glow(0xffcb71,1.7);signal.position.y=1.9;buoy.add(signal);
  }
  if(id==='binary'){
    const warm=glow(0xffbf70,44,true), white=glow(0xffe6be,64,true);
    white.position.set(-19,10,-65);warm.position.set(2,7.2,-72);scene.add(white,warm);
    sun.position.set(-8,5,-4);sun.color.set(0xffce96);
    const fill=new T.DirectionalLight(0xadd6fd,1);fill.position.set(2,4,5);scene.add(fill);
    station.scale.setScalar(.72);station.position.set(4,1,-13);
  }
  const target=new T.Vector3();
  function draw(t){
    const ease=t*t*(3-2*t);
    if(globe)globe.sphere.rotation.y=(body==='earthDefense'?-1.98:2.1)+t*.24;
    if(id==='escape'){
      globe.group.position.set(-12,-18,-62);globe.group.scale.setScalar(32);
      station.position.set(3.5,.7,-4);station.rotation.z=-.26;station.scale.setScalar(.73);
      camera.position.set(7-4*ease,2+.7*t,10-3*t);camera.lookAt(-2,0,-9);
      ship.position.set(1.4-5*t,.35+1.2*t,5-22*t);ship.rotation.set(.13,.27,.24*t);
    }else if(id==='rings'){
      globe.group.position.set(-9,1,-61);globe.group.scale.setScalar(20);globe.group.rotation.z=-.33;globe.group.rotation.x=-.29+t*.48;fragments.position.z=t*8;
      camera.position.set(3-7*t,1.7+1.1*t,10-8*t);camera.lookAt(-4,1,-24);camera.rotateZ(-.09+.16*t);
      ship.position.set(1.5-5*t,.04+1.7*t,5-16*t);ship.rotation.set(.04,.26,-.42+.67*t);
    }else if(id==='blue'){
      globe.group.position.set(16+4*t,-7,-54);globe.group.scale.setScalar(25);
      camera.position.set(-4+4*t,2.4,11);camera.lookAt(1,1,-22);
      ship.position.set(-3.4+4*t,.15+1.1*t,5-25*t);ship.rotation.set(.06,-.18,-.23+.32*t);
    }else if(id==='buoy'){
      camera.position.set(2.1-t*1.6,2.1,16-t*11);camera.lookAt(0,1,-15-t*4);
      ship.position.set(-1.5-.5*t,.5,11-17*t);ship.scale.setScalar(.72);ship.rotation.set(.04,.20,-.10);
      buoy.position.set(2.7,1,-5);buoy.rotation.y=.5*t;buoy.rotation.z=.19;
      signal.material.opacity=.45+.55*Math.cos(t*10)**4;
      ice.position.z=t*7;
    }else{
      camera.position.set(-1.4+2.1*t,1.8,9-4*t);camera.lookAt(target.set(0,2,-23));
      ship.position.set(-1.4+2*t,.4+t*.6,4-18*t);ship.rotation.set(.045,-.22+.26*t,.16-.22*t);
      station.rotation.y=.55+t*.18;station.rotation.z=-.29;
    }
  }
  return {scene,camera,draw};
}
