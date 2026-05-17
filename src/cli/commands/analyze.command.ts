import { analyze } from '../../analyze.js';
import { formatJson } from '../../utils/formatting.js';
import { processArgs, sharedOptions, sharedPositionals } from '../helpers/args.js';
import { formatHelp } from '../helpers/help.js';
import type { CommandDefinition } from '../types.js';

export const analyzeCommand = {
  name: 'analyze',
  description: 'Analyze which files are cleaned up or not.',

  allowPositionals: true,
  positionals: sharedPositionals,
  options: sharedOptions,

  renderHelp(): string {
    return formatHelp(this as typeof analyzeCommand);
  },

  async run(): Promise<void> {
    const { values: args, positionals: globs } = processArgs(this as typeof analyzeCommand);

    const analyzeResult = await analyze({
      globs,
      directory: args.directory,
      noDefaults: args['no-defaults'],
      globFile: args['glob-file'],
    });

    // oxlint-disable-next-line no-console
    console.log(formatJson(analyzeResult));
  },
} satisfies CommandDefinition;
