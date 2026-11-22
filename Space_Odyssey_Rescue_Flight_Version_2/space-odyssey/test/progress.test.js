import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';

let server, base;
before(async () => {
  const socket=createServer();
  socket.listen(0,'127.0.0.1');
  await once(socket,'listening');
  const port=socket.address().port;
  await new Promise(resolve=>socket.close(resolve));
  base='http://127.0.0.1:'+port;
  server=spawn(process.execPath,['server/index.js'],{
    env:{...process.env,NODE_ENV:'production',PORT:String(port)},stdio:'ignore'
  });
  for(let attempt=0;attempt<80;attempt++){
    const response=await fetch(base+'/healthz').catch(()=>null);
    if(response?.ok)return;
    await delay(50);
  }
  throw new Error('Production server did not become ready');
});
after(async()=>{if(server?.exitCode===null){const exited=once(server,'exit');server.kill();await exited;}});

function save(body,headers={}) {
  return fetch(base+'/api/progress',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...headers},body:JSON.stringify(body)});
}

test('production responses restrict scripts and framing',async()=>{
  const {headers}=await fetch(base+'/healthz');
  assert.match(headers.get('content-security-policy'),/script-src 'self';/);
  assert.match(headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal(headers.get('x-content-type-options'),'nosniff');
  assert.ok(headers.has('strict-transport-security'));
});
test('only a valid same-origin checkpoint is stored for the session',async()=>{
  assert.equal((await save({checkpoint:'marsClear'}, {Origin:'https://elsewhere.invalid'})).status,403);
  assert.equal((await save({checkpoint:'unknown'})).status,400);
  assert.equal((await save({checkpoint:'marsClear',extra:1})).status,400);
  assert.equal((await save({checkpoint:'marsClear'},{'Content-Type':'text/plain'})).status,415);
  const response=await save({checkpoint:'marsClear'});
  assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie');
  for(const text of ['__Host-odyssey=','HttpOnly','Secure','SameSite=Strict','Max-Age=43200','Path=/'])assert.ok(cookie.includes(text));
  const session={Cookie:cookie.split(';')[0]};
  const read=headers=>fetch(base+'/api/progress',{headers}).then(r=>r.json());
  assert.deepEqual(await read({}),{checkpoint:null});
  assert.deepEqual(await read(session),{checkpoint:'marsClear'});
  assert.equal((await save({checkpoint:null},session)).status,200);
  assert.deepEqual(await read(session),{checkpoint:null});
});
