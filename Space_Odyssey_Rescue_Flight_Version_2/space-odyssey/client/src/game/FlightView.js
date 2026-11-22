import * as T from 'three';
import {crateredRock,showHullDamage} from './flightDetail.js';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { newFlight, stepFlight } from './flightModel.js';
import { engineSound, playSound } from './audio.js';

function addMesh(group, geometry, color, position, scale = [1,1,1], lit = true) {
  const material = lit ? new T.MeshStandardMaterial({color, roughness:.48, metalness:.42, flatShading:true})
    : new T.MeshBasicMaterial({color});
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(...position); mesh.scale.set(...scale); group.add(mesh);
  return mesh;
}

export function makeShuttle() {
  const ship = new T.Group();
  ship.userData.engines=[];
  const box = new T.BoxGeometry(), pod = new T.SphereGeometry(1,12,8);
  const skin=addMesh(ship,new T.SphereGeometry(1,20,14),0xc4c8c1,[0,.1,-.15],[.53,.38,1.7]);
  skin.material.flatShading=false;
  for(let i=0;i<5;i++) {
    addMesh(ship,box,0x475761,[0,.417-i*.011,.24+i*.14],[.41,.038,.058]);
  }
  addMesh(ship,pod,0x224d62,[0,.36,-.53],[.39,.23,.78]);
  for (const side of [-1,1]) {
    const outline = new T.Shape();
    outline.moveTo(0,-1.15); outline.lineTo(side*1.68,.76);
    outline.lineTo(side*1.52,1.12); outline.lineTo(0,.73); outline.closePath();
    const wing = addMesh(ship,new T.ExtrudeGeometry(outline,{depth:.12,bevelEnabled:false}),0x9faeb8,[side*.18,-.08,0]);
    wing.rotation.x = Math.PI/2;
    for(let i=0;i<3;i++){
      const seam=addMesh(ship,box,i===0?0xc59952:0x505c63,[side*(.64+i*.25),-.034,.11+i*.27],[.035,.024,.65-i*.09]);
      seam.rotation.y=-side*.46;
    }
    addMesh(ship,pod,0x535c64,[side*.81,.02,.62],[.24,.22,.68]);
    addMesh(ship,box,0xe3a84a,[side*.81,.21,.55],[.12,.045,.64]);
    const fin = addMesh(ship,box,0xaebac3,[side*.77,.27,.73],[.08,.52,.55]);
    fin.rotation.z = -side*.36;
    const nozzle=addMesh(ship,new T.CylinderGeometry(.18,.21,.29,12),0x293947,[side*.81,0,1.12]);
    nozzle.rotation.x=Math.PI/2;
    addMesh(ship,pod,0xb8ffff,[side*.81,0,1.17],[.17,.13,.24],false);
    const jet=addMesh(ship,pod,0x508ae1,[side*.81,0,1.45],[.10,.08,.32],false);
    const scar=addMesh(ship,pod,0x33241f,[side*.93,-.055,.50],[.19,.036,.30]);
    scar.rotation.y=side*.43;scar.visible=false;
    ship.userData.engines.push({side,wing,jet,scar,charcoal:new T.Color(0x382e2a)});
  }
  return ship;
}

export function startFlight(mount, controls, relay, report, finish, showResult) {
  let renderer;
  try { renderer = new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch { renderer = new SVGRenderer(); renderer.setQuality('low'); }
  const softwareView = renderer.domElement.tagName.toLowerCase()==='svg';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setSize(960,540,false); mount.appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x1b2838,.009);
  const camera = new T.PerspectiveCamera(54,16/9,.1,260);
  const sun = new T.DirectionalLight(0xffe4c3,3); sun.position.set(-8,10,-6); scene.add(sun);
  scene.add(new T.HemisphereLight(0xc6ddff,0x73543b,2.2));
  const ship = makeShuttle(); scene.add(ship);
  const gate = new T.Group(); scene.add(gate);
  const rim = new T.TorusGeometry(2.4,.15,7,32);
  for (let i=0;i<3;i++) addMesh(gate,rim,i===0?0x74ffe3:0x727f8e,[0,0,-i*1.65],[1,1,1],i>0);
  const strut = new T.BoxGeometry();
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const lamp=addMesh(gate,strut,0xa2ffeb,[2.38*Math.cos(a),2.38*Math.sin(a),-1.8],[.12,.14,3.9],false);
    lamp.rotation.z=a;
  }
  const wreck = new T.Group();
  addMesh(wreck,new T.CylinderGeometry(.83,.76,1.7,10),0x5b626d,[0,0,0]);
  const truss=new T.BoxGeometry();
  for(const side of [-1,1]){
    const rib=addMesh(wreck,truss,0xb09c76,[side*.74,0,0],[.12,1.92,.18]);
    rib.rotation.z=side*.22;
    addMesh(wreck,truss,0x935d31,[side*.41,.66,0],[.6,.18,1.2]);
  }
  const lamps=[];
  for(let row=0;row<4;row++){
    const lamp=addMesh(wreck,truss,0x66c7dd,[0,.72-row*.45,.81],[1.22,.055,.05],false);
    lamps.push(lamp.material);
  }
  const rimLight=new T.DirectionalLight(0xffd496,1.35);rimLight.position.set(7,1,-15);scene.add(rimLight);
  const state = newFlight(relay);
  gate.position.set(state.gateX,state.gateY,-120);
  const rocks = new Map(), geometries = [1,4,7,10].map(seed=>crateredRock(seed,softwareView));
  const rockMat=new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.93});
  const engine=engineSound(),keys=new Set();
  const watched=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'];
  function key(e) { if(watched.includes(e.code)){e.preventDefault(); if(e.type==='keydown')keys.add(e.code);else keys.delete(e.code);} }
  function blur(){keys.clear(); for(const k of ['up','down','left','right'])controls[k]=false;}
  window.addEventListener('keydown',key);window.addEventListener('keyup',key);window.addEventListener('blur',blur);
  const down=(name,a,b)=>Boolean(controls[name]||keys.has(a)||keys.has(b));
  let frame, last, lastReport, lastMessage=0, resultAge=0, thrust=false, lastDraw=-Infinity;
  function draw(now) {
    const dt=Math.min((now-(last??now))/1000,.05);last=now;
    const dx=Number(down('right','KeyD','ArrowRight'))-Number(down('left','KeyA','ArrowLeft'));
    const dy=Number(down('up','KeyW','ArrowUp'))-Number(down('down','KeyS','ArrowDown'));
    if (thrust!==Boolean(dx||dy)){thrust=!thrust;engine?.thrust(thrust);}
    if(state.result===null) {
      stepFlight(state,dx,dy,dt);
      if(state.messageUntil!==lastMessage){lastMessage=state.messageUntil; playSound(state.message==='Hull impact'?'impact':'ping');}
      if(state.result!==null){showResult(state.result);playSound(state.result?'clear':'defeat');}
    } else {
      resultAge+=dt;
      if(resultAge>1.92){finish(state.result);return;}
    }
    showHullDamage(ship,state.damage,state.time,reducedMotion);
    const wreckState=state.obstacles.find(rock=>rock.kind==='wreck');
    if(wreckState){
      const distance=Math.hypot(wreckState.x-state.x,wreckState.y-state.y,wreckState.z);
      lamps.forEach((lamp,row)=>{
        const intensity=T.MathUtils.clamp(1-(distance-3-row*5)/8,0,1);
        lamp.color.setRGB(.04+intensity*.62,.14+intensity*.73,.18+intensity*.67);
      });
    }
    ship.position.set(state.x,state.y,state.result===true?-resultAge*5:0);
    ship.rotation.z = -state.vx*(reducedMotion ? .016 : .044) + (state.result===false?resultAge*.6:0);
    ship.rotation.x = state.vy*.022;
    ship.visible = state.result!==null || state.immune-state.time<.15 || Math.sin(now*.03)>-.48;
    // A parallel chase camera keeps the docking ring and the ship on the same sight line.
    camera.position.set(state.x*.72,state.y*.72+2.65,8.5);
    camera.lookAt(state.x*.72,state.y*.72-.25,-6);
    gate.position.z=Math.min(-2,-120+state.time*7.05);
    for(const [rock,mesh] of rocks) if(!state.obstacles.includes(rock)){scene.remove(mesh);rocks.delete(rock);}
    for(const rock of state.obstacles) {
      let mesh=rocks.get(rock);
      if(!mesh){mesh=rock.kind==='wreck'?wreck.clone():new T.Mesh(geometries[Math.floor(rock.seed*4)],rockMat);mesh.scale.setScalar(rock.radius);scene.add(mesh);rocks.set(rock,mesh);}
      mesh.rotation.set(rock.seed*8+state.time*.25,state.time*(.25+rock.seed),rock.seed*13);
      mesh.position.set(rock.x,rock.y,rock.z);
    }
    const offsetX=state.gateX-state.x, offsetY=state.gateY-state.y;
    let guide='Hold position · docking clamps engaging';
    if(Math.hypot(offsetX,offsetY)>=1.32) {
      const direction=Math.abs(offsetX)>Math.abs(offsetY)?(offsetX>0?'right':'left'):(offsetY>0?'up':'down');
      guide='Docking ring · steer '+direction;
    }
    const hint=state.docking?guide:
      (state.time<state.messageUntil?state.message:'Steer through debris · 3 near misses repair 1 hull');
    const target=state.docking?Math.round(state.dockTime*100):Math.max(0,Math.ceil(16.7-state.time));
    const hud={health:state.hull,target,targetMax:state.docking?100:17,targetLabel:state.docking?'Dock lock %':'Approach',warning:hint};
    if(!lastReport || lastReport.health!==hud.health || lastReport.target!==target ||
        lastReport.warning!==hint || lastReport.targetLabel!==hud.targetLabel) {
      lastReport=hud; report(hud);
    }
    if(!softwareView || now-lastDraw>=32) {
      renderer.render(scene,camera);
      lastDraw=now;
    }
    frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
  return ()=>{
    cancelAnimationFrame(frame);engine?.stop();window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',blur);
    const geo=new Set(geometries),materials=new Set([rockMat]);
    for(const root of [scene,wreck]) root.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)materials.add(o.material);});
    for(const g of geo)g.dispose();for(const m of materials)m.dispose();
    renderer.dispose?.();renderer.domElement.remove();
  };
}
