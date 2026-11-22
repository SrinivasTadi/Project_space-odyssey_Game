import * as T from 'three';
import { world, planet, shuttle, glow } from './cinematicWorld.js';
import { landmark } from './arrivalSites.js';

const cameraPlans = {
  earth:[-9,5,17, 3.4,2.8,13], earthDefense:[-6,4,19, -1,2.6,13],
  jupiter:[8,4,18, 3,3,13], saturn:[8,4.8,17, 2,5.6,11],
  uranus:[-6,4,17, 3,3.1,14], neptune:[-5,2,17, 3,1.5,13],
  venus:[7,3.8,17, 1,4.1,13]
};

export function arrivalScene(id) {
  const {scene,camera,sky,sun}=world(), globe=planet(id);
  const rock=id==='mars'||id==='mercury';
  const place=landmark(id), ship=shuttle();
  scene.add(globe.group,place.group,ship);
  let solarGlow;
  if(id==='mercury'){
    solarGlow=glow(0xffcf8c,22,true);solarGlow.position.set(-22,9,-52);scene.add(solarGlow);
    sun.position.set(-10,2,-2);sun.color.set(0xffe4b7);
  }
  const a=new T.Vector3(),b=new T.Vector3(),focus=new T.Vector3();
  const start=new T.Vector3(),end=new T.Vector3();
  const path=cameraPlans[id];
  if(path){start.fromArray(path);end.fromArray(path,3);}
  const space=new T.Color(0x050916), dust=new T.Color(0x8c5848);
  const haze=new T.FogExp2(0xa77056,.021);
  // A wide orbital pass cuts to a low flyover or an orbital station approach.
  function draw(progress){
    const local=progress<.44 ? progress/.44 : (progress-.44)/.56;
    const eased=local*local*(3-2*local), seconds=progress*6.2;
    const near=progress>=.44;
    globe.group.visible=!near || !rock;place.group.visible=near;
    sky.visible=!(near && id==='mars');
    scene.background.copy(near&&id==='mars'?dust:space);
    scene.fog=near&&id==='mars'?haze:null;
    if(solarGlow)solarGlow.visible=near;
    if(!near){
      globe.group.position.set(-7+local*.45,4.2,-51);
      globe.group.scale.setScalar(id==='saturn'?13.2:16.6);
      camera.position.set(4.2-2.4*eased,2.25+eased*.5,10.6-eased*.8);
      camera.lookAt(-.7,2,-14);
      ship.position.set(2.1-1.9*eased,-.28+eased*.48,1.1-9*eased);
      ship.scale.setScalar(.90);ship.rotation.set(.07,.40-local*.18,-.14+.24*eased);
    }else if(rock){
      camera.position.set(id==='mars'?1.4:-2.2,4.15+eased*.45,12-12*eased);
      focus.set(-.4,2,-15-8*eased);camera.lookAt(focus);
      ship.position.set(-1.3+eased*2.6,2.8+.35*Math.sin(Math.PI*local),5-15*eased);
      ship.scale.setScalar(.70);ship.rotation.set(.02,-.17,.18*Math.sin(local*4));
    }else{
      camera.position.lerpVectors(start,end,eased);camera.lookAt(.1,.95,0);
      globe.group.scale.setScalar(id==='saturn'?15:24);
      globe.group.position.set(-16,5,-51);
      ship.position.lerpVectors(a.set(3.5,2.2,8.1),b.set(-5.1,.8,-6.5),eased);
      ship.scale.setScalar(.63);ship.rotation.set(.1,.49,.19*Math.sin(local*4));
    }
    globe.sphere.rotation.y=(id==='earthDefense'?-2.06:id==='earth'?-1.08:2.1)+seconds*.025;
    place.update(seconds);
  }
  return {scene,camera,draw};
}
