import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newFlight,stepFlight} from '../client/src/game/flightModel.js';

test('scorch marks follow the side hit and clear one at a time on repair',()=>{
  const s=newFlight(false);
  s.nextWave=100;
  function pass(x){
    s.obstacles=[{x,y:0,z:-.05,radius:.8,checked:false}];
    stepFlight(s,0,0,.02);
  }
  pass(-.9);assert.deepEqual(s.damage,[-1]);
  s.time+=1.1;pass(.7);assert.deepEqual(s.damage,[-1,1]);assert.equal(s.hull,3);
  for(let i=0;i<3;i++)pass(1.8);
  assert.deepEqual(s.damage,[-1]);assert.equal(s.hull,4);
  for(let i=0;i<3;i++)pass(1.8);
  assert.deepEqual(s.damage,[]);assert.equal(s.hull,5);
});
