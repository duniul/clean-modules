import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs'],
  entry: ['src/index.ts', 'src/cli/cli.ts'],
  outDir: 'dist',
  target: 'node14',
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
});
