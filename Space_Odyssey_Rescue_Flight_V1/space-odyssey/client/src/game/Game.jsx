import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameHUD from '../components/GameHUD.jsx';
import AsteroidScene from './AsteroidScene.js';
import CombatScene from './CombatScene.js';
import { HEIGHT, MAX_HEALTH, WIDTH } from './constants.js';

const directions = [['up', '↑', 'Up'], ['left', '←', 'Left'], ['down', '↓', 'Down'], ['right', '→', 'Right']];

function HoldButton({ control, input, label, children }) {
  function release(event) {
    input[control] = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }
  return (
    <button className="secondary" type="button" aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        input[control] = true;
      }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      {children}
    </button>
  );
}

export default function Game({ stage, mission, onFinish }) {
  const mount = useRef(null);
  const input = useRef({});
  const callback = useRef(onFinish);
  callback.current = onFinish;
  const [hud, setHud] = useState({ health: MAX_HEALTH });
  const [result, setResult] = useState(null);
  const flight = (stage === 'flight' || stage === 'relay');

  useEffect(() => {
    let active = true;
    const finish = (won) => { if (active) callback.current(won); };
    const scene = (stage === 'flight' || stage === 'relay')
      ? new AsteroidScene(input.current, setHud, finish, setResult)
      : new CombatScene(stage, input.current, setHud, finish, setResult);
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: mount.current,
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: '#080b16',
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
      scene
    });
    return () => {
      active = false;
      game.destroy(true);
    };
  }, [stage]);

  return (
    <section className="game-screen" aria-label={mission.title}>
      <GameHUD mission={mission} hud={hud} />
      <div className="arena-view">
        <div ref={mount} className="game-canvas" aria-label={flight ? 'Asteroid flight' : 'Combat arena'} />
        {result !== null && <div className={'resolution ' + (result ? 'won' : 'lost')} role="status">
          <div className="resolution-caption">
            <span>{mission.label}</span>
            <strong>{result ? (flight ? 'Passage secured' : 'Guardian victorious') : 'Signal lost'}</strong>
          </div>
        </div>}
      </div>
      <div className="game-controls">
        <p><kbd>WASD</kbd> / <kbd>Arrows</kbd> {flight ? 'Steer' : 'Move'}
          {!flight && <> <kbd>Space</kbd> Fire <kbd>Shift</kbd> Dodge · 22 shots, then 4 s to recharge</>}
        </p>
        <div className="touch-controls" aria-label="Touch controls">
          <div className="direction-pad">
            {directions.map(([control, character, label]) => (
              <HoldButton key={control} control={control} input={input.current} label={label}>{character}</HoldButton>
            ))}
          </div>
          {!flight && <div className="touch-actions">
            <HoldButton control="dodge" input={input.current} label="Dodge">Dodge</HoldButton>
            <HoldButton control="fire" input={input.current} label="Fire">Fire</HoldButton>
          </div>}
        </div>
      </div>
    </section>
  );
}
