import path from 'path';
import { terminalWidth } from 'yargs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { DEFAULT_GLOBS_FILE_NAME } from '../constants';
import { analyzeCommand } from './commands/analyzeCommand';
import { cleanCommand } from './commands/cleanCommand';

const SCRIPT_NAME = 'clean-modules';
const CLEAN_DESCRIPTION =
  'Removes unnecessary files to reduce the size of your node_modules directory.';
const ANALYZE_DESCRIPTION =
  'Helps determining why a file is included by the clean command without removing any files.';

function handleError(error: Error) {
  console.error(error);
  process.exit(1);
}

const printWidth = Math.min(Math.max(terminalWidth(), 50), 150);

yargs(hideBin(process.argv))
  .scriptName(SCRIPT_NAME)
  .wrap(printWidth)
  .usage(`${SCRIPT_NAME} 🧹\n`)
  .option('help', {
    alias: 'h',
    description: 'Show this help text',
    type: 'boolean',
    global: true,
  })
  .option('version', {
    alias: 'v',
    description: 'Show script version',
    type: 'boolean',
    global: true,
  })
  .option('include', {
    alias: 'i',
    description: 'Custom glob patterns for files to include',
    type: 'string',
    array: true,
  })
  .option('exclude', {
    alias: 'e',
    description: 'Custom glob patterns for files to exclude',
    type: 'string',
    array: true,
  })
  .option('directory', {
    alias: 'D',
    description: 'Path to node_modules.',
    type: 'boolean',
    default: 'node_modules',
  })
  .option('glob-file', {
    alias: 'f',
    description: 'Path to a custom globs file.',
    type: 'string',
    default: DEFAULT_GLOBS_FILE_NAME,
  })
  .option('no-defaults', {
    alias: 'n',
    description: 'Only includes/excludes globs specified by a custom glob file or CLI arguments.',
    type: 'boolean',
  })
  .option('json', {
    alias: 'j',
    description: 'Only logs a final JSON dump at the end of the script.',
    type: 'boolean',
  })
  .command(
    '*',
    CLEAN_DESCRIPTION,
    yargsArgv => {
      return yargsArgv
        .usage('Usage:\n $ $0 [command] [options]')
        .option('keep-empty', {
          alias: 'k',
          description: 'Skips removing empty folders after removing contents.',
          type: 'boolean',
          default: false,
        })
        .option('dry-run', {
          alias: 'd',
          description: 'Runs the script and prints results without removing any files.',
          type: 'boolean',
        })
        .option('silent', {
          alias: 's',
          description: 'Does not log anything to console (unless --json is enabled).',
          type: 'boolean',
        })
        .option('yes', {
          alias: 'y',
          description: 'Skips the confirmation prompt at the start of the script.',
          type: 'boolean',
        });
    },
    async args => {
      await cleanCommand({
        argGlobs: { included: args.include || [], excluded: args.exclude || [] },
        nodeModulesPath: path.resolve(process.cwd(), args.directory),
        useDefaultGlobs: args['defaults'] !== false,
        userGlobsFilePath: args['glob-file'],
        keepEmpty: args['keep-empty'],
        dryRun: !!args['dry-run'],
        json: !!args.json,
        silent: !!args.silent,
        yes: !!args.yes,
      }).catch(handleError);
    }
  )
  .command(
    'analyze',
    ANALYZE_DESCRIPTION,
    yargsArgv => {
      return yargsArgv.usage(`${ANALYZE_DESCRIPTION}\n\nUsage:\n $ $0 [options]`);
    },
    async args => {
      await analyzeCommand({
        argGlobs: { included: args.include || [], excluded: args.exclude || [] },
        nodeModulesPath: path.resolve(process.cwd(), args.directory),
        useDefaultGlobs: args['defaults'] !== false,
        userGlobsFilePath: args['glob-file'],
      }).catch(handleError);
    }
  ).argv;
