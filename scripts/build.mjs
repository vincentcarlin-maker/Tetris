import * as esbuild from 'esbuild';
import { mkdir, rm, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const dev = process.argv.includes('--dev');
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'icon.svg', 'manifest.json', 'sw.js', 'legal.html']) await copyFile(file, `dist/${file}`);
await writeFile('dist/.nojekyll', '');
const options = {
    entryPoints: ['index.tsx'], bundle: true, outfile: 'dist/index.js', jsx: 'automatic', minify: !dev,
    define: {
        'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
        'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || ''),
    },
    logLevel: 'info',
};
if (dev) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    await ctx.serve({ servedir: 'dist', host: '127.0.0.1', port: 3000 });
    console.log('Neon Arcade : http://localhost:3000');
} else await esbuild.build(options);
