import { defineCommand, runMain } from 'citty';
import pkgJson from '../../package.json' with { type: 'json' };

const { name, version, description } = pkgJson;

const main = defineCommand({
  meta: {
    name,
    version,
    description,
  },
  subCommands: {
    clean: () => import('./commands/clean.command').then(module => module.cleanCommand),
    analyze: () => import('./commands/analyze.command').then(module => module.analyzeCommand),
  },
});

runMain(main);
