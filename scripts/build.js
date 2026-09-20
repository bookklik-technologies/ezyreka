import { readFileSync } from 'node:fs';
import esbuild from 'esbuild';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const define = { __EZREKA_VERSION__: JSON.stringify(version) };

await Promise.all([
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/ezyreka.esm.js',
    sourcemap: true,
    define,
    logLevel: 'info'
  }),
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'cjs',
    outfile: 'dist/ezyreka.cjs',
    sourcemap: true,
    define,
    logLevel: 'info'
  }),
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'Ezyreka',
    outfile: 'dist/ezyreka.umd.js',
    sourcemap: true,
    define,
    logLevel: 'info'
  })
]).catch((err) => {
  console.error(err);
  process.exit(1);
});
