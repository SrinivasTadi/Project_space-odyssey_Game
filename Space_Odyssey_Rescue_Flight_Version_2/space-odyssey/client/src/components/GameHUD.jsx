import React from 'react';
import Portrait from './Portrait.jsx';
import { MAGAZINE, MAX_HEALTH, RECHARGE_MS } from '../game/constants.js';

export default function GameHUD({ mission, hud }) {
  return (
    <header className="game-hud">
      <div className="mission-title">
        <Portrait speaker="Guardian" compact />
        <div>
          <p className="location">{mission.label}</p>
          <h1>{mission.title}</h1>
        </div>
      </div>
      <div className="meter-group">
        <label className="meter">Hull <span>{hud.health} / {MAX_HEALTH}</span>
          <progress value={hud.health} max={MAX_HEALTH} />
        </label>
        {hud.targetMax != null && (
          <label className="meter target">{hud.targetLabel ?? 'Boss'} <span>{hud.target} / {hud.targetMax}</span>
            <progress value={hud.target} max={hud.targetMax} />
          </label>
        )}
      </div>
      {hud.ammo != null && <div className={'weapon-cell' + (hud.rechargeMs ? ' charging' : '')}>
        <span>{hud.rechargeMs ? 'Recharging' : 'Pulse rifle'}</span>
        <progress aria-label={hud.rechargeMs ? 'Recharge progress' : 'Shots remaining'}
          max={hud.rechargeMs ? RECHARGE_MS : MAGAZINE}
          value={hud.rechargeMs ? RECHARGE_MS - hud.rechargeMs : hud.ammo} />
        <strong>{hud.rechargeMs ? (Math.ceil(hud.rechargeMs / 100) / 10).toFixed(1) + ' s' : hud.ammo + ' / ' + MAGAZINE}</strong>
      </div>}
      <p className="attack-warning" role="status">{hud.warning || mission.objective}</p>
    </header>
  );
}
