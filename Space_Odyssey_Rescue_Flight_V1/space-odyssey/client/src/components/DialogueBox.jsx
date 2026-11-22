import { playSound } from '../game/audio.js';
import React, { useEffect, useState } from 'react';
import Portrait from './Portrait.jsx';

export default function DialogueBox({ scene, onAdvance }) {
  const [line, setLine] = useState(0);
  const [speaker, message] = scene.lines[line];
  useEffect(() => { playSound('radio'); }, [line, scene]);
  const lastLine = line === scene.lines.length - 1;

  return (
    <section className="story-screen" aria-labelledby="scene-title">
      <div className="scene-heading">
        <p className="location">{scene.location}</p>
        <h1 id="scene-title">{scene.title}</h1>
      </div>
      <div className="dialogue">
        <div className="dialogue-content" aria-live="polite" aria-atomic="true">
          <Portrait key={speaker} speaker={speaker} />
          <div className="dialogue-line" key={line}>
            <p className="speaker">{speaker}</p>
            <p className="transmission">{message}</p>
          </div>
        </div>
        <div className="dialogue-footer">
          <span aria-label={`Dialogue ${line + 1} of ${scene.lines.length}`}>{line + 1} / {scene.lines.length}</span>
          <button className="primary" onClick={() => lastLine ? onAdvance(scene.next) : setLine(line + 1)}>
            {lastLine ? scene.action : 'Next'}
          </button>
        </div>
      </div>
    </section>
  );
}
