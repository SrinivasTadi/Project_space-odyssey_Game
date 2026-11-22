import React,{useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {createRenderer,disposeScene,metal,piece,studioLight} from '../game/orbitalModels.js';
import {playSound} from '../game/audio.js';

function buildRecorder() {
  const body=new T.Group(), bronze=metal(0xa57548), steel=metal(0x71787b);
  const dark=metal(0x29313b), lamp=metal(0xffac5c,0xd86b22);
  const box=new T.BoxGeometry(), screw=new T.CylinderGeometry(.048,.048,.06,8);
  piece(body,box,dark,0,0,0,2.35,1.37,.9);
  for(const x of [-1.05,1.05]){
    piece(body,box,bronze,x,0,0,.15,1.48,.98);
    for(const y of [-.56,.56])for(const z of [-.5,.5]){
      piece(body,screw,steel,x,y,z).rotation.x=Math.PI/2;
    }
  }
  piece(body,box,bronze,0,.36,.46,1.68,.17,.07);
  for(let i=0;i<8;i++)piece(body,box,steel,-.66+i*.19,-.12,.48,.08,.48,.07);
  piece(body,box,lamp,.67,.35,.51,.18,.065,.04);
  // The rear plate is recessed at the impact point. Three pinpricks mark the contact.
  const panel=new T.PlaneGeometry(1.91,1.13,26,16), points=panel.attributes.position;
  for(let i=0;i<points.count;i++){
    const dx=points.getX(i)-.34,dy=points.getY(i)+.09;
    points.setZ(i,-.19*Math.exp(-(dx*dx*13+dy*dy*24)));
  }
  panel.computeVertexNormals();
  piece(body,panel,bronze,0,0,-.65).rotation.y=Math.PI;
  for(let i=0;i<3;i++)piece(body,new T.SphereGeometry(.037,8,6),dark,-.23-i*.095,-.1+i*.015,-.509,1,.8,.7);
  const aerial=piece(body,new T.CylinderGeometry(.034,.047,.68,8),steel,.85,1.01,0);
  aerial.rotation.z=-.14;
  return body;
}

export default function Transmitter({onClose}) {
  const dialog=useRef(null), mount=useRef(null), angle=useRef(.2), drag=useRef(null);
  const [found,setFound]=useState(false);
  useEffect(()=>{
    const el=dialog.current;el.showModal();
    const renderer=createRenderer(560,310), world=new T.Scene(), model=buildRecorder();
    world.add(model);studioLight(world);
    const cam=new T.PerspectiveCamera(35,560/310,.1,20);cam.position.set(0,1.4,4.3);cam.lookAt(0,.2,0);
    mount.current.appendChild(renderer.domElement);
    let frame,current=angle.current,previous,seen=false;
    function draw(now){
      const dt=Math.min(.06,(now-(previous??now))/1000);previous=now;
      current+=(angle.current-current)*(1-Math.exp(-dt*16));model.rotation.y=current;
      if(!seen && Math.cos(current)<-.82){
        seen=true;setFound(true);playSound('knocks');
      }
      renderer.render(world,cam);frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(frame);disposeScene(world,renderer);el.close();};
  },[]);
  return <dialog className="recorder-view" ref={dialog} aria-labelledby="recorder-title"
    onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();angle.current+=e.key==='ArrowLeft'?-.23:.23;}
    }}>
    <h2 id="recorder-title">Mars transmitter</h2>
    <div className="recorder-model" ref={mount} onPointerDown={e=>{
      drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerMove={e=>{
      if(drag.current!==null){angle.current+=(e.clientX-drag.current)*.017;drag.current=e.clientX;}
    }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
    <p aria-live="polite">{found?'Three indentations in the rear casing. When you touch the metal, three knocks answer.':'Turn the casing to examine the damage on the back.'}</p>
    <div className="actions"><button className="secondary" onClick={()=>{angle.current-=Math.PI/4;}}>Turn left</button>
      <button className="secondary" onClick={()=>{angle.current+=Math.PI/4;}}>Turn right</button>
      <button className="primary" onClick={onClose}>Back to deck</button></div>
  </dialog>;
}
