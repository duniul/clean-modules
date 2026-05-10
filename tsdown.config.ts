import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  entry: ['src/index.ts', 'src/cli/cli.ts'],
  outDir: 'dist',
  target: 'node22',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  sourcemap: false,
  clean: true,
  dts: true,
});
