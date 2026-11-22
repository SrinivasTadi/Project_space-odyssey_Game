import { spawn } from 'node:child_process';

const commands = [['server/index.js'], ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--strictPort']];
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
