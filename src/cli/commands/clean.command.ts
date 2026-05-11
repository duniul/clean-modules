import { defineCommand } from 'citty';
import { clean } from '../../clean.js';
import type { CleanFailure } from '../../shared.js';
import { formatBytes, formatMs } from '../../utils/formatting.js';
import { sharedArgs } from '../helpers/args.js';
import { makeSimpleLogger, yesOrNo } from '../utils/terminal.js';

const JSON_INDENT = 2;
const MAX_PRINTED_FAILURES = 5;

function formatFailureLine(failure: CleanFailure): string {
  const prefix = failure.code ? `${failure.code}: ` : '';
  return `  ${prefix}${failure.path} (${failure.phase} failed: ${failure.message})`;
}

export const cleanCommand = defineCommand({
  meta: {
    name: 'clean',
    description:
      'Removes unnecessary files to reduce the size of your node_modules directory. Extra globs can be passed as positional args.',
  },
  args: {
    ...sharedArgs,
    'keep-empty': {
      type: 'boolean',
      alias: ['k'],
      default: false,
      description: 'Skips removing empty folders after removing contents',
    },
    'dry-run': {
      type: 'boolean',
      alias: ['d'],
      default: false,
      description: 'Logs files that would be removed without removing any files',
    },
    'silent': {
      type: 'boolean',
      alias: ['s'],
      default: false,
      description: 'Does not log anything to console (unless --json is enabled)',
    },
    'json': {
      type: 'boolean',
      alias: ['j'],
      default: false,
      description: 'Output results as JSON',
    },
    'yes': {
      type: 'boolean',
      alias: ['y'],
      default: false,
      description: 'Skips the confirmation prompt at the start of the script',
    },
    'fail-on-error': {
      type: 'boolean',
      default: false,
      description: 'Exit with a non-zero status code if any file failed to be removed',
    },
  },
  async run({ args }): Promise<void> {
    const logger = makeSimpleLogger({ disabled: args.json || args.silent });

    logger.log(`clean-modules${args['dryRun'] ? ' (dry run)' : ''}`);

    if (!args.yes && !args['dryRun']) {
      const warning = `\nPreparing to clean node_modules at: ${args.directory}\nAre you sure you want to continue? (Y/N) `;
      const confirmed = await yesOrNo(warning);

      if (!confirmed) {
        // oxlint-disable-next-line unicorn/no-process-exit
        process.exit(0);
      }
    }

    logger.log('\nCleaning up node_modules...');

    const cleanupStart = Date.now();

    const { removedFilesCount, reducedSize, removedEmptyDirs, failures } = await clean({
      globs: args._,
      dryRun: args['dry-run'],
      noDefaults: args['no-defaults'],
      globFile: args['glob-file'],
      keepEmpty: args['keep-empty'],
      directory: args.directory,
    });

    const cleanupDuration = Date.now() - cleanupStart;
    logger.log(`Done in ${formatMs(cleanupDuration)}!`);

    if (args.json) {
      const output: Record<string, unknown> = {
        removedFiles: removedFilesCount,
        reducedSize,
        removedEmptyDirs,
        duration: cleanupDuration,
        dryRun: args['dry-run'],
        failures,
      };

      // oxlint-disable-next-line no-console
      console.log(JSON.stringify(output, null, JSON_INDENT));
    } else {
      logger.log('\nResults:');
      logger.log('- size reduced:', formatBytes(reducedSize));
      logger.log('- files removed:', removedFilesCount);
      logger.log('- empty dirs removed:', removedEmptyDirs);

      if (failures.length > 0) {
        logger.log('- failures:', failures.length);

        const printed = failures.slice(0, MAX_PRINTED_FAILURES);
        const remaining = failures.length - printed.length;

        logger.log(`\nFailed to process ${failures.length} ${failures.length === 1 ? 'file' : 'files'}:`);
        for (const failure of printed) {
          logger.log(formatFailureLine(failure));
        }
        if (remaining > 0) {
          logger.log(`  ...${remaining} more (use --json to see all)`);
        }
      }
    }

    if (failures.length > 0 && args['fail-on-error']) {
      // oxlint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }
  },
});
