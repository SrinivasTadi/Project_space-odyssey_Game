import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { port: { type: 'string', default: '5173' } } });
if (!/^\d{1,5}$/.test(values.port) || Number(values.port) < 1 || Number(values.port) > 65535) {
  throw new Error('Use a port number between 1 and 65535.');
}
const commands = [['server/index.js'], ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', values.port, '--strictPort']];
const children = commands.map((args) => spawn(process.execPath, args, { stdio: 'inherit' }));
function stop(code) {
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const child of children) {
  child.on('exit', (code) => stop(process.exitCode ?? code ?? 0));
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
}
process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));
