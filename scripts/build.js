import esbuild from 'esbuild';

await Promise.all([
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/ezyreka.esm.js',
    sourcemap: false,
    logLevel: 'info'
  }),
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'Ezyreka',
    outfile: 'dist/ezyreka.umd.js',
    sourcemap: false,
    logLevel: 'info'
  })
]).catch((err) => {
  console.error(err);
  process.exit(1);
});
