import * as T from 'three';

export function crateredRock(seed, lowDetail) {
  const geometry=new T.IcosahedronGeometry(1,lowDetail?2:8);
  const vertices=geometry.attributes.position;
  const colors=new Float32Array(vertices.count*3);
  const craters=Array.from({length:9},(_,i)=>{
    const y=1-2*(i+.5)/9, angle=i*2.39996+seed, r=Math.sqrt(1-y*y);
    return {x:r*Math.cos(angle), y, z:r*Math.sin(angle), radius:.19+.07*(1+Math.sin(i+seed))};
  });
  const color=new T.Color();
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
    let shape=.94+.065*Math.sin(x*7+y*5+seed)*Math.cos(z*7-seed), shade=.84;
    for(const crater of craters){
      const d=Math.hypot(x-crater.x,y-crater.y,z-crater.z)/crater.radius;
      if(d>1.4)continue;
      const bowl=Math.max(0,1-d*d);
      const rim=Math.exp(-((d-1)**2)/.055);
      shape+=.065*rim-.16*bowl;
      shade+=.22*rim-.42*bowl;
    }
    vertices.setXYZ(i,x*shape*1.04,y*shape*.91,z*shape);
    color.setRGB(.46*shade,.37*shade,.30*shade);
    color.toArray(colors,i*3);
  }
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function showHullDamage(ship, damage, time, reducedMotion) {
  for(const assembly of ship.userData.engines){
    const count=damage.filter(side=>side===assembly.side).length;
    const severity=Math.min(1,count*.52);
    assembly.wing.material.color.set(0x9faeb8).lerp(assembly.charcoal,severity);
    assembly.scar.visible=count>0;
    const flicker=reducedMotion?1:1-.22*Math.sin(time*17)**2;
    assembly.jet.scale.z=.32*(1-severity*.45)*(count?flicker:1);
    assembly.jet.material.color.set(count?0xff9b58:0x508ae1);
  }
}
