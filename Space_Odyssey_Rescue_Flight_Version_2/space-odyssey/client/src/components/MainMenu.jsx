import React from 'react';

export default function MainMenu({ checkpoint, onAdvance }) {
  return (
    <section className="menu-screen" aria-labelledby="game-title">
      <div className="menu-copy">
        <h1 id="game-title">Space<br />Odyssey</h1>
        <p className="subtitle">The Last Guardian</p>
        <p className="premise">The planetary guardians have turned against Earth. Travel across the solar system, free the guardians, and return to defend Earth.</p>
        <div className="actions">
          {checkpoint && <button className="primary" onClick={() => onAdvance(checkpoint)}>Continue mission</button>}
          <button className={checkpoint ? 'secondary' : 'primary'} onClick={() => onAdvance('earth')}>
            {checkpoint ? 'New game' : 'Start mission'}
          </button>
        </div>
      </div>

    </section>
  );
}
