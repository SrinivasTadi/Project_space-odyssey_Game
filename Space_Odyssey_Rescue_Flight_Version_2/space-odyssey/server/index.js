import express from 'express';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isCheckpoint } from '../client/src/data/story.js';

const app = express();
const production = process.env.NODE_ENV === 'production';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const sessions = new Map();
const sessionLifetime = 12 * 60 * 60 * 1000;
function savedSession(key) {
  const record = sessions.get(key);
  if (record && record.expires <= Date.now()) {
    sessions.delete(key);
    return undefined;
  }
  return record;
}
const cookieName = production ? '__Host-odyssey' : 'odyssey';
const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
function allowedOrigin(origin, host) {
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.host !== host) return false;
    return url.protocol === 'https:' || (url.protocol === 'http:' && (!production || loopback.has(url.hostname)));
  } catch {
    return false;
  }
}
const throttle = new Map();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'X-Frame-Options':'DENY',
    'Cross-Origin-Resource-Policy':'same-origin',
    'Cross-Origin-Opener-Policy':'same-origin',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; worker-src 'none'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  });
  if (production) res.set('Strict-Transport-Security','max-age=31536000');
  next();
});
app.get('/healthz', (_req,res) => res.sendStatus(200));
app.use('/api', (req,res,next) => {
  res.set('Cache-Control','no-store');
  if (req.method === 'POST') {
    if (req.get('sec-fetch-site') === 'cross-site') return res.sendStatus(403);
    const origin = req.get('origin');
    if (origin && !allowedOrigin(origin, req.get('host'))) return res.sendStatus(403);
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
app.get('/api/progress', (req,res) => res.json({checkpoint:savedSession(session(req))?.checkpoint ?? null}));
app.post('/api/progress', (req,res) => {
  if (!req.body || Array.isArray(req.body) || Object.keys(req.body).length !== 1 ||
      !Object.hasOwn(req.body,'checkpoint')) return res.sendStatus(400);
  const checkpoint = req.body.checkpoint;
  if (checkpoint !== null && !isCheckpoint(checkpoint)) return res.sendStatus(400);
  let key = session(req);
  if (checkpoint === null) {
    sessions.delete(key);
    res.clearCookie(cookieName,{httpOnly:true,secure:production,sameSite:'strict',path:'/'});
  }
  else {
    if (!savedSession(key)) {
      key = randomBytes(32).toString('hex');
      if (sessions.size >= 5000) sessions.delete(sessions.keys().next().value);
    }
    sessions.set(key,{checkpoint,expires:Date.now()+sessionLifetime});
    res.cookie(cookieName,key,{httpOnly:true,secure:production,sameSite:'strict',path:'/',maxAge:sessionLifetime});
  }
  res.json({checkpoint});
});
app.use('/api', (_req,res) => res.sendStatus(404));
app.use(express.static(dist,{dotfiles:'deny',index:'index.html'}));
app.use((error,_req,res,_next) => res.sendStatus([400,413,415].includes(error.status) ? error.status : 500));
const server = app.listen(Number(process.env.PORT ?? 3001), production ? '0.0.0.0' : '127.0.0.1');
server.headersTimeout = 15000;
server.requestTimeout = 30000;
