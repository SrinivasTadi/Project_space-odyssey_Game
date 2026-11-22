import express from 'express';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isCheckpoint } from '../client/src/data/story.js';

const app = express();
const production = process.env.NODE_ENV === 'production';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const sessions = new Map();
const cookieName = production ? '__Host-odyssey' : 'odyssey';
const throttle = new Map();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'X-Frame-Options':'DENY',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  });
  if (production) res.set('Strict-Transport-Security','max-age=31536000');
  next();
});
app.get('/healthz', (_req,res) => res.sendStatus(200));
app.use('/api', (req,res,next) => {
  res.set('Cache-Control','no-store');
  if (req.method === 'POST') {
    const origin = req.get('origin');
    if (origin && (() => { try { return new URL(origin).host !== req.get('host'); } catch { return true; } })()) return res.sendStatus(403);
    if (!req.is('application/json')) return res.sendStatus(415);
  }
  const key = req.socket.remoteAddress;
  const now = Date.now();
  let bucket = throttle.get(key);
  if (!bucket || bucket.until <= now) {
    if (throttle.size >= 4096) throttle.delete(throttle.keys().next().value);
    bucket = { until:now + 60000, count:0 };
    throttle.set(key,bucket);
  }
  if (++bucket.count > 600) return res.set('Retry-After','60').sendStatus(429);
  next();
});
app.use('/api', express.json({limit:'2kb', inflate:false}));
function session(req) {
  const prefix = cookieName + '=';
  return (req.headers.cookie ?? '').split(';').map(s => s.trim()).find(s => s.startsWith(prefix))?.slice(prefix.length);
}
app.get('/api/progress', (req,res) => res.json({checkpoint:sessions.get(session(req)) ?? null}));
app.post('/api/progress', (req,res) => {
  const checkpoint = req.body?.checkpoint;
  if (checkpoint !== null && !isCheckpoint(checkpoint)) return res.sendStatus(400);
  let key = session(req);
  if (checkpoint === null) sessions.delete(key);
  else {
    if (!sessions.has(key)) {
      key = randomBytes(32).toString('hex');
      res.cookie(cookieName,key,{httpOnly:true,secure:production,sameSite:'strict',path:'/'});
      if (sessions.size >= 5000) sessions.delete(sessions.keys().next().value);
    }
    sessions.set(key,checkpoint);
  }
  res.json({checkpoint});
});
app.use('/api', (_req,res) => res.sendStatus(404));
app.use(express.static(dist,{dotfiles:'deny',index:'index.html'}));
app.use((error,_req,res,_next) => res.sendStatus([400,413,415].includes(error.status) ? error.status : 500));
const server = app.listen(Number(process.env.PORT ?? 3001),'0.0.0.0');
server.headersTimeout = 15000;
server.requestTimeout = 30000;
