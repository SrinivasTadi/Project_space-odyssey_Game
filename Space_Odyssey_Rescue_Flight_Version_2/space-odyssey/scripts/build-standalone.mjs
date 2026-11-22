import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const { outputFiles } = await build({
  entryPoints: ['client/src/main.jsx'],
  outdir: 'dist',
  write: false,
  bundle: true,
  minify: true,
  loader: { '.webp': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"' }
});

const css = outputFiles.find(file => file.path.endsWith('.css')).text;
const js = outputFiles.find(file => file.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const template = await readFile('client/index.html', 'utf8');
const page = template
  .replace('</head>', () => '<style>' + css + '</style></head>')
  .replace('<script type="module" src="/src/main.jsx"></script>', () => '<script>' + js + '</script>');
await writeFile('Play_Space_Odyssey.html', page);
