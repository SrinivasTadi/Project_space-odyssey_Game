import React, { useEffect, useRef, useState } from 'react';
import expedition from '../assets/expedition.webp';
import hangar from '../assets/hangar.webp';
import rings from '../assets/rings.webp';
import belt from '../assets/kuiper.webp';
import arrival from '../assets/arrival.webp';
import { engineSound, playSound } from '../game/audio.js';
import JumpTunnel from './JumpTunnel.jsx';

const shots = [
  { image: hangar, title: 'Launch deck', text: 'Reyes waits on the ramp until all four headsets click onto the crew channel. “Seal us in, Mira.”', sound: 'launch', seconds: 6 },
  { image: rings, title: 'Saturn slingshot', text: 'Sol cuts the engines. Saturn bends their course outward. Beyond its rings, Neptune is a single blue light.', sound: 'approach', seconds: 6 },
  { image: belt, title: 'The last buoy', text: 'An ice-covered buoy taps three times against the hull. Mira answers. A seam of light opens ahead.', sound: 'ping', seconds: 6 },
  { title: 'Gate crossing', text: 'Sol rolls into the opening. For one long breath the crew hear their own transmission coming back.', sound: 'warp', seconds: 5 },
  { image: arrival, title: 'Alpha Centauri', text: 'Two suns clear the bow. Across nineteen missing years, the Ibis docking lamp still flashes.', sound: 'arrival', seconds: 6 }
];

export default function Journey({ onAdvance }) {
  const [index,setIndex] = useState(0);
  const advance=useRef(onAdvance);
  advance.current=onAdvance;
  const shot=shots[index];
  useEffect(() => {
    const engine=engineSound();
    return () => engine?.stop();
  }, []);
  useEffect(() => {
    playSound(shot.sound);
    const timer=setTimeout(() => {
      if (index === shots.length-1) advance.current('centauri');
      else setIndex(index+1);
    },shot.seconds*1000);
    return () => clearTimeout(timer);
  },[index,shot]);
  return <section className="voyage">
    <div key={index} className={'voyage-frame frame-'+index} style={{'--shot-time':shot.seconds+'s'}} aria-hidden="true">
      {shot.image ? <img className="vista" src={shot.image} alt=""/> : <JumpTunnel/>}
      {index!==0 && index!==3 && <img className="voyager" src={expedition} alt=""/>}
      {index===2 && <i className="buoy-light"/>}
    </div>
    <button className="secondary voyage-skip" onClick={() => onAdvance('centauri')}>Skip cinematic</button>
    <div className="voyage-caption" aria-live="polite"><h1>{shot.title}</h1><p>{shot.text}</p></div>
  </section>;
}
