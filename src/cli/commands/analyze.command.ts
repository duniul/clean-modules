import { defineCommand } from 'citty';
import { analyze } from '../../analyze.js';
import { sharedArgs } from '../helpers/args.js';

const JSON_INDENT = 2;

export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description:
      'Helps determining why a file is included by the clean command without removing any files. Extra globs can be passed as positional args.',
  },
  args: sharedArgs,
  async run({ args }): Promise<void> {
    const analyzeResult = await analyze({
      directory: args.directory,
      noDefaults: args['no-defaults'],
      globFile: args['glob-file'],
      globs: args._,
    });

    // oxlint-disable-next-line no-console
    console.log(JSON.stringify(analyzeResult, null, JSON_INDENT));
  },
});
