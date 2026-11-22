import React, { lazy, Suspense, useState } from 'react';
import DialogueBox from './components/DialogueBox.jsx';
import MainMenu from './components/MainMenu.jsx';
import { loadCheckpoint, saveCheckpoint } from './data/progress.js';
import { getStop, isCheckpoint, missions, route, story } from './data/story.js';

import ShipDeck from './components/ShipDeck.jsx';
import { arrivalAt } from './data/cinematics.js';
import { unlockAudio, toggleAudio, playSound } from './game/audio.js';

const PlanetArrival = lazy(() => import('./components/PlanetArrival.jsx'));
const Journey = lazy(() => import('./components/Journey.jsx'));
const Game = lazy(() => import('./game/Game.jsx'));

export default function App() {
  const [muted, setMuted] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [arrival, setArrival] = useState(null);
  const [stage, setStage] = useState('menu');
  const [checkpoint, setCheckpoint] = useState(loadCheckpoint);

  function advance(next) {
    unlockAudio();
    playSound('select');
    setArrival(arrivalAt(next));
    setStage(next);
    setDefeat(false);
    if (isCheckpoint(next)) {
      setCheckpoint(next);
      saveCheckpoint(next);
    }
  }

  const mission = missions[stage];
  const theme = getStop(stage);
  const activeStop = route.findIndex(([id]) => id === (stage === 'menu' && checkpoint ? getStop(checkpoint) : theme));

  return (
    <main className="console">
      <header className="topbar">
        <span className="wordmark"><span aria-hidden="true">✦</span> Space Odyssey</span>
        <button className="quiet" aria-pressed={muted} onClick={() => setMuted(toggleAudio())}>{muted ? 'Sound off' : 'Sound on'}</button>
        {stage !== 'menu' && <button className="quiet" onClick={() => advance('menu')}>Main menu</button>}
      </header>
      <div className={`viewport theme-${theme}`}>
        {stage === 'menu' && <MainMenu checkpoint={checkpoint} onAdvance={advance} />}
        {story[stage] && !arrival && <DialogueBox key={stage} scene={story[stage]} onAdvance={advance} />}
        {arrival && <Suspense fallback={<p className="loading" role="status">Approaching orbit…</p>}>
          <PlanetArrival key={arrival} id={arrival} onFinish={()=>setArrival(null)}/>
        </Suspense>}
        {mission && !defeat && (
          <Suspense fallback={<p className="loading" role="status">Loading arena…</p>}>
            <Game key={`${stage}-${attempt}`} stage={stage} mission={mission}
              onFinish={(won) => won ? advance(mission.next) : setDefeat(true)} />
          </Suspense>
        )}
        {(stage === 'marsDeck' || stage === 'launchDeck') && <ShipDeck key={stage} outbound={stage==='launchDeck'} onAdvance={advance}/>}
        {stage === 'journey' && <Suspense fallback={<p className="loading" role="status">Preparing the shuttle…</p>}>
          <Journey onAdvance={advance} />
        </Suspense>}
        {stage === 'victory' && (
          <section className="end-screen">
            <div>
              <p className="location">Earth secured</p>
              <h1>Earth is safe</h1>
              <p className="premise">The Architect is down and the planetary guardians are free.</p>
              <div className="actions">
                <button className="primary" onClick={() => advance('debrief')}>Report to Command</button>
                <button className="secondary" onClick={() => advance('earth')}>Restart campaign</button>
                <button className="secondary" onClick={() => advance('menu')}>Return to menu</button>
              </div>
            </div>
          </section>
        )}
        {mission && defeat && (
          <section className="end-screen">
            <div>
              <p className="location">{mission.label}</p>
              <h1>Mission failed</h1>
              <p className="premise">Your hull is down. Retry from the start of this encounter.</p>
              <div className="actions">
                <button className="primary" onClick={() => { setAttempt(attempt + 1); setDefeat(false); }}>Retry mission</button>
                <button className="secondary" onClick={() => advance('menu')}>Return to menu</button>
              </div>
            </div>
          </section>
        )}
      </div>
      <nav className="route" aria-label="Campaign route">
        <ol>{route.slice(0, activeStop + 1).map(([id, stop], index) => (
          <li key={id} className={index < activeStop ? 'visited' : ''} aria-current={index === activeStop ? 'step' : undefined}>
            <span aria-hidden="true" />{stop}
          </li>
        ))}</ol>
      </nav>
    </main>
  );
}
