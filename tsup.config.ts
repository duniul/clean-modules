import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['src/index.ts', 'src/cli/cli.ts'],
  outDir: 'dist',
  target: 'node14',
  splitting: true,
  sourcemap: false,
  clean: true,
  shims: true,
  dts: true,
});
