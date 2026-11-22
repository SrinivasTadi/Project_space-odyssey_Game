import { wardens } from './planets.js';

export const story = {
  debrief: {
    location: 'Earth · Recovery ward', title: 'Eleven seconds of silence', next: 'archive', action: 'Open the flight recorder',
    lines: [
      ['Commander Reyes', 'The last evacuation shuttle just landed. For the first time tonight, every pilot on my board is green.'],
      ['Guardian', 'Then why is channel six still open?'],
      ['Commander Reyes', 'Mira found it inside the Architect’s core. Eleven seconds of silence, then someone taps three times. That was the knock my sister used on our cabin door.']
    ]
  },
  archive: {
    location: 'Earth · Signal archive', title: 'The fourth seat', next: 'departure', action: 'Take the recording to the crew',
    lines: [
      ['Ship AI', 'Voiceprint match: survey vessel Ibis. Lost nineteen years ago. Last known position: the Kuiper Belt.'],
      ['Commander Reyes', 'My sister flew on Ibis. I signed the order to end the search. Play the rest.'],
      ['Ship AI', 'Recovered message: “We crossed. Both suns are real. Our relay is failing. Please send a pilot.”'],
      ['Guardian', 'Two suns. Sol can use the recording to fix a bearing. Mira can keep the relay alive. That leaves a fourth seat, Commander.']
    ]
  },
  departure: {
    location: 'Earth · Launch control', title: 'A rescue flight', next: 'launchDeck', action: 'Board the shuttle',
    lines: [
      ['Commander Reyes', 'Sol plotted a course past the outer planets. The gate opens beyond Neptune, where Ibis disappeared.'],
      ['Guardian', 'Earth has its guardians back. We have a navigator, an engineer, and a pilot. Are you coming?'],
      ['Commander Reyes', 'I’ve owed her an answer for nineteen years. Take us out.']
    ]
  },
  centauri: { location: 'Alpha Centauri · Chapter II', title: 'The returning signal', next: 'relay', action: 'Approach the relay',
    lines: [['Guardian', 'That docking light has been running for nineteen years. Someone has been keeping it lit.'], ['Commander Reyes', 'Sol has a fix. Approach slowly. There is debris around the relay.']] },
  relayClear: { location: 'Alpha Centauri · Relay station', title: 'First contact', next: 'earth', action: 'Restart campaign',
    lines: [['Ship AI', 'Docking complete. The relay has transmitted a star chart.'], ['Guardian', 'Log the coordinates. Our next expedition starts here.']] },

  earth: {
    location: 'Earth · Defense Command', title: 'Emergency transmission', next: 'marsBrief', action: 'Depart for Mars',
    lines: [
      ['Defense System', 'Priority alert. An unknown signal has corrupted the planetary guardians. Earth is next.'],
      ['Commander Reyes', 'Guardian, you’re our last pilot. Head to Mars and take down the Crimson Warden. We need to find out who’s behind this.'],
      ['Guardian', 'Copy that, Command. Setting a course for Mars.']
    ]
  },
  marsBrief: {
    location: 'Mars · Valles Marineris', title: 'The Crimson Warden', next: 'mars', action: 'Enter arena',
    lines: [
      ['Crimson Warden', 'Earth sent one guardian? I’ll bury you beneath the red dust.'],
      ['Guardian', 'Something’s controlling you. I’ll break its hold.']
    ]
  },
  marsClear: {
    location: 'Mars · Valles Marineris', title: 'Signal intercepted', next: 'marsDeck', action: 'Board your ship',
    lines: [
      ['Commander Reyes', 'The Warden’s down. We traced the control signal to Jupiter. The shortest route crosses the asteroid belt.'],
      ['Guardian', 'I’m inbound. Keep Earth’s defenses online.']
    ]
  },
  flightBrief: {
    location: 'Asteroid Belt · Transit', title: 'Debris ahead', next: 'flight', action: 'Enter the belt',
    lines: [
      ['Ship AI', 'Unstable corridor ahead. Steer between the wreckage. Three clean near misses patch one hull point. When the docking lights turn green, line up and hold steady.']
    ]
  },
  jupiterBrief: {
    location: 'Jupiter · Orbital station', title: 'The Storm Warden', next: 'jupiter', action: 'Enter arena',
    lines: [
      ['Storm Warden', 'My master watched you on Mars. Did you really think you were winning?'],
      ['Ship AI', 'That amber relay feeds its shield. Stand beside it until lightning locks on, then dodge sideways. Fire when the shield drops.']
    ]
  },
  reveal: {
    location: 'Earth · Open frequency', title: 'A voice in the dark', next: 'earthDefense', action: 'Defend Earth',
    lines: [
      ['Commander Reyes', 'Mercury’s relay is down, but someone just opened a channel inside Earth’s defense perimeter.'],
      ['The Architect', 'I built the guardians to protect your worlds. Now I’m taking them back, starting with Earth.'],
      ['Guardian', 'Command, clear the lower deck. I’ll handle the Architect.']
    ]
  }
};

const arrivals = [
  ['saturn', 'Jupiter’s relay went quiet. Saturn’s Ringkeeper is broadcasting through the debris. Watch for shrapnel spreading in every direction.', 'The rings are mine. Take one more step and they’ll tear you apart.'],
  ['uranus', 'We found a second relay at the north pole of Uranus. Move when ice starts forming under your boots.', 'Your world burns so brightly. I wonder how long it would take to freeze.'],
  ['neptune', 'Neptune is the last outer relay. Break it and we can trace the signal back toward the Sun.', 'The platform will wash away before you reach me.'],
  ['venus', 'Neptune’s relay pointed inward. Venus is feeding the network through a refinery in its cloud layer.', 'The air here can melt a ship. Let’s see what it does to you.'],
  ['mercury', 'Mercury is the final relay. Cut it off before the network can redirect its power to Earth.', 'I can draw all the energy I need from the Sun. How much do you have left?']
];

for (const [id, briefing, response] of arrivals) {
  const warden = wardens[id];
  story[`${id}Brief`] = {
    location: `${warden.label} · ${warden.location}`,
    title: warden.title,
    next: id,
    action: 'Enter arena',
    lines: [['Commander Reyes', briefing], [warden.title, response]]
  };
}

const combatRoute = [
  ['mars', 'marsClear'], ['jupiter', 'saturnBrief'], ['saturn', 'uranusBrief'],
  ['uranus', 'neptuneBrief'], ['neptune', 'venusBrief'], ['venus', 'mercuryBrief'],
  ['mercury', 'reveal'], ['earthDefense', 'victory']
];

export const missions = { relay: { label:'Alpha Centauri', title:'Relay approach', next:'relayClear', objective:'Steer through the debris to dock.' }, flight: { label: 'Asteroid Belt', title: 'Asteroid Belt', next: 'jupiterBrief', objective: 'Survive the asteroid belt.' } };
for (const [id, next] of combatRoute) {
  const { label, title } = wardens[id];
  missions[id] = { label, title, next, objective: `Defeat ${title}.` };
}

export const route = [
  ['earth', 'Earth'], ['mars', 'Mars'], ['flight', 'Asteroid Belt'], ['jupiter', 'Jupiter'],
  ['saturn', 'Saturn'], ['uranus', 'Uranus'], ['neptune', 'Neptune'], ['venus', 'Venus'],
  ['mercury', 'Mercury'], ['earthDefense', 'Earth return'], ['centauri', 'Alpha Centauri']
];
const sceneStops = { marsDeck:'mars', launchDeck:'earthDefense', debrief:'earthDefense', archive:'earthDefense', departure:'earthDefense', journey:'earthDefense', relay:'centauri', relayClear:'centauri', menu: 'earth', marsClear: 'mars', reveal: 'earthDefense', victory: 'earthDefense' };

export function getStop(stage) {
  return sceneStops[stage] ?? stage.replace(/Brief$/, '');
}

export function isCheckpoint(stage) {
  return typeof stage === 'string' && (stage === 'marsDeck' || stage === 'launchDeck' || stage === 'victory' || stage === 'journey' || Object.hasOwn(story, stage));
}
