import { isCheckpoint } from './story.js';

const checkpointKey = 'space-odyssey-campaign-v2';
let pendingSave = Promise.resolve();

export function loadCheckpoint() {
  try {
    const checkpoint = localStorage.getItem(checkpointKey);
    if (isCheckpoint(checkpoint)) return checkpoint;
    const previous = localStorage.getItem('space-odyssey-checkpoint');
    if (previous === 'victory' || previous === 'reveal') return 'saturnBrief';
    return isCheckpoint(previous) ? previous : null;
  } catch {
    return null;
  }
}

export function saveCheckpoint(checkpoint) {
  try {
    localStorage.setItem(checkpointKey, checkpoint);
    if (globalThis.location.protocol === 'file:') return;
    pendingSave = pendingSave.then(() => fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkpoint }),
      signal: AbortSignal.timeout(3000)
    })).catch(() => {});
  } catch {
    // A storage restriction still allows the current run to continue.
  }
}
