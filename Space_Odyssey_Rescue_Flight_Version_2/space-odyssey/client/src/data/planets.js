export const wardens = {
  mars: {
    label: 'Mars', title: 'Crimson Warden', location: 'Valles Marineris',
    background: 0x1e101b, stars: 0xffd2a8, floor: 0x351925, grid: 0x904839,
    armor: 0xe65b44, highlight: 0xffc063, hp: 18, cooldown: 1700, telegraph: 900,
    pattern: 'spread', warning: 'Incoming fire spread', speed: 255
  },
  jupiter: {
    label: 'Jupiter', title: 'Storm Warden', location: 'Orbital station',
    background: 0x0f1730, stars: 0xe0dbff, floor: 0x1c2542, grid: 0x65569f,
    armor: 0x9766e9, highlight: 0x9fedff, hp: 23, cooldown: 1590, telegraph: 850,
    pattern: 'columns', warning: 'Lightning columns charging'
  },
  saturn: {
    label: 'Saturn', title: 'Ringkeeper', location: 'Ring relay',
    background: 0x241b18, stars: 0xffe3ad, floor: 0x3c2a20, grid: 0x816137,
    armor: 0xd69853, highlight: 0xffdf92, hp: 26, cooldown: 1480, telegraph: 810,
    pattern: 'ring', warning: 'Shrapnel ring charging', speed: 225
  },
  uranus: {
    label: 'Uranus', title: 'Frost Sentinel', location: 'Polar platform',
    background: 0x082229, stars: 0xc4ffff, floor: 0x142f3d, grid: 0x377486,
    armor: 0x55abbc, highlight: 0xc4ffff, hp: 29, cooldown: 1370, telegraph: 770,
    pattern: 'strike', warning: 'Ice burst at your position', radius: 73
  },
  neptune: {
    label: 'Neptune', title: 'Tide Warden', location: 'Deep relay',
    background: 0x10143a, stars: 0xb7d1ff, floor: 0x17274e, grid: 0x385899,
    armor: 0x4862dc, highlight: 0x8de6ff, hp: 32, cooldown: 1260, telegraph: 730,
    pattern: 'wave', warning: 'Tidal beams charging'
  },
  venus: {
    label: 'Venus', title: 'Sulfur Warden', location: 'Cloud refinery',
    background: 0x292014, stars: 0xffec96, floor: 0x3a3218, grid: 0x8e782c,
    armor: 0xaba64b, highlight: 0xfcf381, hp: 35, cooldown: 1150, telegraph: 690,
    pattern: 'strike', warning: 'Acid plume at your position', radius: 96
  },
  mercury: {
    label: 'Mercury', title: 'Solar Warden', location: 'Terminator station',
    background: 0x2b1219, stars: 0xffd19a, floor: 0x412025, grid: 0x8f5342,
    armor: 0xc9543d, highlight: 0xffa752, hp: 38, cooldown: 1040, telegraph: 650,
    pattern: 'spread', warning: 'Solar flare spread', speed: 340
  },
  earthDefense: {
    label: 'Earth', title: 'The Architect', location: 'Defense Command',
    background: 0x0c1628, stars: 0xb7dcff, floor: 0x182638, grid: 0x426581,
    armor: 0x596b8a, highlight: 0xff967a, hp: 42, cooldown: 930, telegraph: 610,
    pattern: 'mixed', warning: 'Orbital strike charging', radius: 92
  }
};
