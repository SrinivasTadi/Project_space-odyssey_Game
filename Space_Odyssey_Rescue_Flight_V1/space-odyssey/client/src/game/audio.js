let context;
let output;
let muted = false;

export function unlockAudio() {
  try {
    if (!context) {
      context = new AudioContext();
      output = context.createGain();
      output.gain.value = muted ? 0 : 0.65;
      output.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  } catch { /* Gameplay also works without audio hardware. */ }
}

export function toggleAudio() {
  unlockAudio();
  muted = !muted;
  if (output) output.gain.setTargetAtTime(muted ? 0 : 0.65, context.currentTime, 0.01);
  return muted;
}

const sounds = {
  mars: ['sawtooth',140,42], jupiter:['square',390,36],
  saturn:['sine',860,420], uranus:['sine',1450,720],
  neptune:['triangle',220,60], venus:['sine',70,430],
  mercury:['sawtooth',570,190], earthDefense:['triangle',330,55],
  radio:['sine',1100,760,0.065], select:['triangle',330,550,0.09],
  fire:['triangle',860,145,0.10], dodge:['sawtooth',195,50,0.15],
  empty: ['triangle',240,85,0.18], charged: ['sine',470,820,0.18],
  impact:['sawtooth',120,31,0.24], hit:['triangle',335,115,0.07],
  defeat:['triangle',198,49,0.8], clear:['sine',294,740,0.5],
  revive:['sawtooth',46,245,1.55], thaw:['sine',1520,420,0.25],
  splash:['triangle',460,73,0.22], launch:['triangle',46,125,1.6],
  approach:['sine',240,360,1.2], ping:['sine',900,880,0.42],
  warp:['sawtooth',52,515,1.9], arrival:['sine',185,554,1.55]
};

export function playSound(name) {
  if (!context || muted || context.state !== 'running') return;
  const [wave, start, end, duration = 0.34] = sounds[name];
  const osc = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  osc.type = wave;
  osc.frequency.setValueAtTime(start, now);
  osc.frequency.exponentialRampToValueAtTime(end, now + duration);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain).connect(output);
  osc.start(); osc.stop(now + duration + 0.01);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

export function engineSound() {
  if (!context) return;
  const engine = context.createOscillator();
  const gain = context.createGain();
  engine.type = 'triangle';
  engine.frequency.value = 54;
  gain.gain.value = 0.05;
  engine.connect(gain).connect(output);
  engine.start();
  return {
    thrust(moving) { engine.frequency.setTargetAtTime(moving ? 86 : 54, context.currentTime, 0.18); },
    stop() { engine.stop(); engine.disconnect(); gain.disconnect(); }
  };
}
