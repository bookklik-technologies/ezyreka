import esbuild from 'esbuild';

const ctx = await esbuild.context({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: false,
  format: 'iife',
  globalName: 'SenangDesign',
  outfile: 'dist/senangdesign.umd.js',
  sourcemap: true,
  logLevel: 'info'
});

await ctx.watch();
const server = await ctx.serve({ servedir: '.', port: 8080 });
console.log(`Dev server running at http://localhost:${server.port}/examples/`);
