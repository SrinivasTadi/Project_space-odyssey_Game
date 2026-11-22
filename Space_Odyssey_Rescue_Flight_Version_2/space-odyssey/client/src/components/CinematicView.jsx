import React,{useEffect,useRef} from 'react';
import * as T from 'three';
import { releaseWorld } from '../game/cinematicWorld.js';

// Both camera angles have a frame rendered from the same scene for laptops without WebGL.
export default function CinematicView({id,build,poster,paired=false,seconds,onComplete}) {
  const host=useRef(null),gpu=useRef(null),callback=useRef(onComplete);
  callback.current=onComplete;
  useEffect(()=>()=>{
    const renderer=gpu.current;
    if(renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();gpu.current=null;}
  },[]);
  useEffect(()=>{
    const el=host.current,motion=matchMedia('(prefers-reduced-motion: reduce)');
    let disabled=motion.matches,frame,elapsed=0,last=null,lastPaint=-Infinity,active=true;
    let shot=null,images=[];
    delete el.dataset.live;
    el.dataset.angle='wide';
    if(build && !disabled){
      try{
        if(!gpu.current){
          const canvas=document.createElement('canvas');
          const context=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'low-power'});
          if(context){
            gpu.current=new T.WebGLRenderer({canvas,context});
            el.appendChild(canvas);
          }
        }
        if(gpu.current && !gpu.current.getContext().isContextLost()){
          shot=build(id);
          shot.scene.traverse(o=>{if(o.material?.map && !o.material.map.image) images.push(o.material.map);});
          const width=Math.min(1120,Math.max(480,Math.round(el.clientWidth*Math.min(devicePixelRatio,1.35))));
          gpu.current.setSize(width,Math.round(width*9/16),false);
        }
      }catch{disabled=true;}
    }
    function contextLost(e){e.preventDefault();disabled=true;delete el.dataset.live;}
    function preference(e){disabled=e.matches;delete el.dataset.live;}
    function visibility(){last=null;}
    const canvas=gpu.current?.domElement;
    canvas?.addEventListener('webglcontextlost',contextLost);
    motion.addEventListener('change',preference);
    document.addEventListener('visibilitychange',visibility);
    function draw(now){
      if(!active)return;
      if(!document.hidden && last!==null)elapsed+=(now-last)/1000;
      last=now;
      const t=Math.min(1,elapsed/seconds);
      el.dataset.angle=paired && t>=.44?'near':'wide';
      if(!disabled){
        const cut=paired ? Math.max(0,1-Math.abs(t-.44)/.035)*.70 : 0;
        const fade=Math.max(0,1-t/.045,(t-.96)/.04,cut);
        if(fade>0 || el.style.getPropertyValue('--shot-fade')!=='0'){
          el.style.setProperty('--shot-fade',fade>0?fade.toFixed(2):'0');
        }
      }else{
        el.style.removeProperty('--shot-fade');
      }
      if(!document.hidden && !disabled && shot && now-lastPaint>=1000/36 && images.every(tex=>tex.image)){
        try{shot.draw(t);gpu.current.render(shot.scene,shot.camera);el.dataset.live='yes';}
        catch{disabled=true;delete el.dataset.live;}
        lastPaint=now;
      }
      if(t>=1){callback.current();return;}
      frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    return ()=>{
      active=false;cancelAnimationFrame(frame);
      canvas?.removeEventListener('webglcontextlost',contextLost);
      motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);
      if(shot)releaseWorld(shot.scene);
      delete el.dataset.live;
    };
  },[id,build,seconds,paired]);
  return <div ref={host} className={'cinema-render'+(paired?' paired':'')} aria-hidden="true"
    style={{backgroundImage:'url("'+poster+'")'}}/>;
}
