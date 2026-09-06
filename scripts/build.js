import esbuild from 'esbuild';

await Promise.all([
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/senangdesign.esm.js',
    sourcemap: false,
    logLevel: 'info'
  }),
  esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'SenangDesign',
    outfile: 'dist/senangdesign.umd.js',
    sourcemap: false,
    logLevel: 'info'
  })
]).catch((err) => {
  console.error(err);
  process.exit(1);
});
