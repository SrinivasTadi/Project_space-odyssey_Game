import React,{useEffect} from 'react';
import {arrivals} from '../data/cinematics.js';
import {posters} from '../data/cinemaPosters.js';
import {arrivalScene} from '../game/arrivalScene.js';
import {playSound} from '../game/audio.js';
import CinematicView from './CinematicView.jsx';

export default function PlanetArrival({id,onFinish}) {
  const {name,location,title}=arrivals[id];
  useEffect(()=>{playSound('approach');},[id]);
  return <section className="planet-arrival" aria-label={name+' arrival'}>
    <CinematicView id={id} build={arrivalScene} poster={posters[id]} paired seconds={5.8} onComplete={onFinish}/>
    <button className="secondary voyage-skip" onClick={onFinish}>Skip arrival</button>
    <div className="arrival-caption"><p className="location">{name} · {location}</p><h1>{title}</h1></div>
  </section>;
}
