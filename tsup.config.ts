import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['lib/index.ts'],
  target: 'es2020',
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
