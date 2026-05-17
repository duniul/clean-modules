import { clean } from '../../clean.js';
import type { CleanFailure } from '../../shared.js';
import { formatBytes, formatJson, formatMs } from '../../utils/formatting.js';
import { processArgs, sharedOptions, sharedPositionals } from '../helpers/args.js';
import { formatHelp, NAME } from '../helpers/help.js';
import type { CommandDefinition } from '../types.js';
import { makeSimpleLogger, yesOrNo } from '../utils/terminal.js';

const MAX_PRINTED_FAILURES = 5;

function formatFailureLine(failure: CleanFailure): string {
  const prefix = failure.code ? `${failure.code}: ` : '';
  return `  ${prefix}${failure.path} (${failure.phase} failed: ${failure.message})`;
}

export const cleanCommand = {
  name: 'clean',
  description: 'Remove unnecessary files in your node_modules directory.',
  extraUsageInfo: 'Extra globs can be passed as positional args.',

  allowPositionals: true,
  positionals: sharedPositionals,

  options: {
    ...sharedOptions,
    'keep-empty': {
      type: 'boolean',
      short: 'k',
      description: 'Skips removing empty folders after cleanup',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      short: 'd',
      description: 'Runs clean without removing any files',
      default: false,
    },
    'silent': {
      type: 'boolean',
      short: 's',
      description: 'Does not log anything to console',
      default: false,
    },
    'json': {
      type: 'boolean',
      short: 'j',
      description: 'Output results as JSON',
      default: false,
    },
    'yes': {
      type: 'boolean',
      short: 'y',
      description: 'Skips the confirmation prompt',
      default: false,
    },
    'fail-on-error': {
      type: 'boolean',
      short: 'e',
      description: 'Exit with a non-zero status code on file errors',
      default: false,
    },
  },

  renderHelp(): string {
    return formatHelp(this as typeof cleanCommand);
  },

  async run(): Promise<void> {
    const { values: args, positionals: globs } = processArgs(this as typeof cleanCommand);
    const logger = makeSimpleLogger({ disabled: args.json || args.silent });

    logger.log(`${NAME}${args['dry-run'] ? ' (dry run)' : ''}`);

    if (!args.yes && !args['dry-run']) {
      if (!process.stdin.isTTY) {
        console.error(
          'stdin is not a TTY, skipping confirmation prompt. Please use --yes or -y to skip the prompt.'
        );

        // oxlint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }

      const warning = `\nPreparing to clean node_modules at: ${args.directory}\nAre you sure you want to continue? (Y/N) `;
      const confirmed = await yesOrNo(warning);

      if (!confirmed) {
        // oxlint-disable-next-line unicorn/no-process-exit
        process.exit(0);
      }
    }

    logger.log('\nCleaning up node_modules...');

    const cleanupStart = Date.now();

    const { files, removedFilesCount, reducedSize, removedEmptyDirs, failures } = await clean({
      globs,
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
      console.log(formatJson(output));
    } else {
      const dryRunSuffix = args['dry-run'] ? '(skipped in dry run)' : '';
      logger.log('\nResults:');
      logger.log('- size reduced:', formatBytes(reducedSize));
      logger.log('- files matched:', files.length);
      logger.log('- files removed:', removedFilesCount, dryRunSuffix);
      logger.log('- empty dirs removed:', removedEmptyDirs, dryRunSuffix);

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
} satisfies CommandDefinition;
