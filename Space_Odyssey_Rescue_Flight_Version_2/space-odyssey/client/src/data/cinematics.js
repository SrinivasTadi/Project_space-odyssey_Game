export const arrivals = {
  earth:{name:'Earth',location:'Defense Command',title:'Home orbit'},
  mars:{name:'Mars',location:'Valles Marineris',title:'Descent into the rift'},
  jupiter:{name:'Jupiter',location:'Orbital station',title:'Into the storm belt'},
  saturn:{name:'Saturn',location:'Ring relay',title:'Approach the Ringkeeper'},
  uranus:{name:'Uranus',location:'Polar platform',title:'Beneath the aurora'},
  neptune:{name:'Neptune',location:'Deep relay',title:'Eye of the vortex'},
  venus:{name:'Venus',location:'Cloud refinery',title:'Above the sulphur clouds'},
  mercury:{name:'Mercury',location:'Terminator station',title:'The sunward ridge'},
  earthDefense:{name:'Earth',location:'Defense perimeter',title:'The fractured hemisphere'}
};

// Briefing checkpoints stay compatible with saves from earlier releases.
export function arrivalAt(stage) {
  if(stage==='earth') return 'earth';
  if(stage==='reveal') return 'earthDefense';
  if(!stage.endsWith('Brief')) return null;
  const id=stage.slice(0,-5);
  return Object.hasOwn(arrivals,id) ? id : null;
}

export const voyage = [
  {id:'boarding',title:'Launch deck',text:'Reyes waits on the ramp until all four headsets click onto the crew channel. “Seal us in, Mira.”',sound:'launch',seconds:4.8},
  {id:'escape',title:'Earth departure',text:'The shuttle clears the defense station. Behind them, the first rescue lights return to Earth’s dark hemisphere.',sound:'approach',seconds:4.8},
  {id:'rings',title:'Saturn slingshot',text:'Sol cuts thrust. The rings turn edge-on beneath the shuttle as Saturn bends their course outward.',sound:'approach',seconds:5},
  {id:'blue',title:'Beyond Neptune',text:'Neptune’s last storm slips astern. The receiver picks up a faint signal from beyond the planets.',sound:'radio',seconds:4.7},
  {id:'buoy',title:'The last buoy',text:'Among the Kuiper Belt ice, a survey buoy knocks three times. Mira answers. A seam of light opens ahead.',sound:'knocks',seconds:5.4},
  {id:'gate',title:'Gate crossing',text:'Sol banks into the opening. For one long breath the crew hear their own transmission coming back.',sound:'warp',seconds:5.3},
  {id:'binary',title:'Alpha Centauri',text:'Two suns clear the bow. Across nineteen missing years, the Ibis docking lamp still flashes.',sound:'arrival',seconds:5.5}
];
