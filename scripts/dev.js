import esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const ctx = await esbuild.context({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: false,
  format: 'iife',
  globalName: 'Ezyreka',
  outfile: 'dist/ezyreka.umd.js',
  sourcemap: true,
  define: { __EZREKA_VERSION__: JSON.stringify(version) },
  logLevel: 'info'
});

await ctx.watch();
const server = await ctx.serve({ servedir: '.', port: 8080 });
console.log(`Dev server running at http://localhost:${server.port}/examples/`);
