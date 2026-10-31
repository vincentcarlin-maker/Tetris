import { context } from 'esbuild';
const ctx = await context({});
await ctx.serve({ servedir: 'dist', host: '127.0.0.1', port: 3000 });
console.log('Neon Arcade : http://localhost:3000');
