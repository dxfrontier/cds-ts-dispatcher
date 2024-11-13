import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./lib/index.ts'],
    target: 'es2022',
    format: ['cjs', 'esm'],
    splitting: true,
    sourcemap: true,
    dts: true,
  },
  {
    entry: ['./postinstall/PostInstall.ts'],
    target: 'es2022',
    format: ['cjs', 'esm'],
    splitting: true,
    sourcemap: true,
    dts: true,
    outDir: './postinstall',
  },
]);
