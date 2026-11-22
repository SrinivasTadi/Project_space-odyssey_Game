import React, {lazy,Suspense,useEffect,useRef,useState} from 'react';
import guardian from '../assets/guardian.webp';
import Portrait from './Portrait.jsx';
import {playSound} from '../game/audio.js';

const Transmitter=lazy(()=>import('./Transmitter.jsx'));
const stations = [
  {x:18,name:'Recorder'}, {x:52,name:'Crew station'}, {x:83,name:'Cockpit'}
];
export default function ShipDeck({outbound,onAdvance}) {
  const pilot=useRef(null), position=useRef(44), destination=useRef(null), keys=useRef(new Set());
  const [station,setStation]=useState(null),[entry,setEntry]=useState(null);
  const [inspecting,setInspecting]=useState(false);
  const room=useRef(null), paused=useRef(false), recorder=useRef(null);
  const interact=useRef(null);
  interact.current=(id)=>{
    if(id===2){onAdvance(outbound?'journey':'flightBrief');return;}
    setEntry(id);
    if(id===0){paused.current=true;keys.current.clear();setInspecting(true);}
    else playSound('radio');
  };
  useEffect(()=>{
    let frame,last,phase=0,previousStation;
    const down=e=>{
      if(paused.current)return;
      if(e.altKey||e.ctrlKey||e.metaKey)return;
      if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code)){
        e.preventDefault();keys.current.add(e.code);destination.current=null;
      }
      if(e.code==='KeyE'&&!e.repeat){
        const index=stations.findIndex(s=>Math.abs(s.x-position.current)<9);
        if(index>=0)interact.current(index);
      }
    };
    const up=e=>keys.current.delete(e.code);
    const blur=()=>keys.current.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    function draw(now) {
      const dt=Math.min(.05,(now-(last??now))/1000);last=now;
      let direction=Number(keys.current.has('KeyD')||keys.current.has('ArrowRight'))-Number(keys.current.has('KeyA')||keys.current.has('ArrowLeft'));
      if(destination.current!==null) {
        const gap=stations[destination.current].x-position.current;
        if(Math.abs(gap)<dt*33+.12) {
          position.current=stations[destination.current].x;
          const arrived=destination.current;destination.current=null;
          interact.current(arrived);
        }else direction=Math.sign(gap);
      }
      if(direction) {
        position.current=Math.max(5,Math.min(94,position.current+direction*32*dt));
        phase+=dt*13;pilot.current.style.setProperty('--face',direction);
        setEntry(null);
      }
      room.current.style.setProperty('--camera', ((position.current-44)/50).toFixed(3));
      pilot.current.style.left=position.current+'%';
      pilot.current.style.setProperty('--step',(direction?-Math.abs(Math.sin(phase))*3:0)+'px');
      const near=stations.findIndex(s=>Math.abs(s.x-position.current)<9);
      if(near!==previousStation){previousStation=near;setStation(near);}
      frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);
  const lines=outbound?[
    'The pulse is clearer now. Three knocks, a pause, then three more. From the cockpit, Reyes answers with her knuckles.',
    'I used to count eleven seconds before knocking back. She always waited for the answer. I hope she still does.'
  ]:[
    'The Mars transmitter has no power cell. Through its metal case you feel three quiet knocks. Then silence.',
    'Mira dated that transmitter twice. Both readings say nineteen years. I signed off the last search flight nineteen years ago.'
  ];
  return <section className={'ship-deck'+(outbound?' outbound':'')} aria-label="Walkable ship interior">
    <header className="deck-title"><p className="location">Expedition shuttle</p><h1>Flight deck</h1></header>
    <div className="deck-room" ref={room}>
      <div className="deck-wall" aria-hidden="true"/>
      <div className="deck-windows" aria-hidden="true"/>
      <div className="deck-pipes" aria-hidden="true"><i/><i/></div>
      {stations.map((s,i)=><button key={s.name} className="deck-station" ref={i===0?recorder:undefined} style={{left:s.x+'%'}}
        onClick={()=>{if(Math.abs(position.current-s.x)<.2)interact.current(i);else destination.current=i;}}>{s.name}</button>)}
      <img ref={pilot} className="deck-pilot" src={guardian} alt="Guardian"/>
    </div>
    {inspecting && <Suspense fallback={<p role="status">Opening the recorder…</p>}><Transmitter onClose={()=>{
      paused.current=false;setInspecting(false);recorder.current?.focus();
    }}/></Suspense>}
    <div className="deck-status" aria-live="polite">
      {entry!==null?<><Portrait compact speaker={entry===1?'Commander Reyes':'Guardian'}/><p><strong>{entry===1?'Commander Reyes':'Guardian'}</strong> {lines[entry]}</p></>:
       <p>Walk with A / D, or select a station. {station>=0&&station!==null?'Press E at the '+stations[station].name.toLowerCase()+'.':'The cockpit continues the mission.'}</p>}
    </div>
  </section>;
}
