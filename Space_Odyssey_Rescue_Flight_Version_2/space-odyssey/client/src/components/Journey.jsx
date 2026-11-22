import React,{useEffect,useState} from 'react';
import {voyage} from '../data/cinematics.js';
import {posters} from '../data/cinemaPosters.js';
import {voyageScene} from '../game/voyageScene.js';
import {engineSound,playSound} from '../game/audio.js';
import CinematicView from './CinematicView.jsx';

export default function Journey({onAdvance}) {
  const [index,setIndex]=useState(0);
  const shot=voyage[index];
  useEffect(()=>{const engine=engineSound();return ()=>engine?.stop();},[]);
  useEffect(()=>{playSound(shot.sound);},[shot]);
  function next(){if(index===voyage.length-1)onAdvance('centauri');else setIndex(index+1);}
  return <section className="voyage" aria-label="Rescue flight to Alpha Centauri">
    <CinematicView id={shot.id} build={shot.id==='boarding'?null:voyageScene} poster={posters[shot.id]} seconds={shot.seconds} onComplete={next}/>
    <button className="secondary voyage-skip" onClick={()=>onAdvance('centauri')}>Skip cinematic</button>
    <div className="voyage-caption" aria-live="polite"><h1>{shot.title}</h1><p>{shot.text}</p></div>
  </section>;
}
