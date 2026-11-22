import test from 'node:test';
import assert from 'node:assert/strict';
import {arrivals,arrivalAt,voyage} from '../client/src/data/cinematics.js';
import {story,isCheckpoint} from '../client/src/data/story.js';
import {wardens} from '../client/src/data/planets.js';

test('all eight planets introduce their own scene and a combat retry goes directly to the encounter',()=>{
  assert.equal(arrivalAt('earth'),'earth');
  assert.equal(arrivalAt('reveal'),'earthDefense');
  for(const id of Object.keys(wardens)){
    const briefing=id==='earthDefense'?'reveal':id+'Brief';
    assert.ok(isCheckpoint(briefing));
    assert.equal(arrivalAt(briefing),id);
    assert.equal(story[briefing].next,id);
    assert.equal(arrivalAt(id),null);
  }
  assert.equal(Object.keys(arrivals).length,9);
  for(const stage of ['flightBrief','marsClear','marsDeck','victory','centauri','menu'])assert.equal(arrivalAt(stage),null);
});
test('the rescue crew boards before crossing the outer system, the gate and the binary star system',()=>{
  assert.deepEqual(voyage.map(s=>s.id),['boarding','escape','rings','blue','buoy','gate','binary']);
  assert.ok(voyage.every(s=>s.seconds>=4 && s.text));
  assert.equal(story.centauri.next,'relay');
});
