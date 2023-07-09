import { Command, Option } from 'clipanion';
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { clean } from '../../clean.js';
import { BaseCommand } from '../helpers/base.command.js';
import { bold, green, makeLogger, yellow, yesOrNo } from '../utils/terminal.js';

export class CleanCommand extends BaseCommand {
  static override paths = [['clean'], Command.Default];
  static override usage = {
    description:
      'Default command. Removes unnecessary files to reduce the size of your node_modules directory. Extra globs can be passed as positional args.',
  };

  keepEmpty = Option.Boolean('-k,--keep-empty', false, {
    description: 'Skips removing empty folders after removing contents',
  });

  dryRun = Option.Boolean('-d,--dry-run', false, {
    description: 'Logs files that would be removed without removing any files',
  });

  silent = Option.Boolean('-s,--silent', false, {
    description: 'Does not log anything to console (unless --json is enabled)',
  });

  yes = Option.Boolean('-y,--yes', false, {
    description: 'Skips the confirmation prompt at the start of the script',
  });

  json = Option.Boolean('-j,--json', false, {
    description: 'Output results as JSON',
  });

  async execute(): Promise<void> {
    const logger = makeLogger({ disabled: this.json || this.silent });

    logger.log(bold('clean-modules'), this.dryRun ? yellow('(dry run)') : '');

    if (!this.yes && !this.dryRun) {
      const warning = `\nPreparing to clean node_modules at: ${this.directory}\nAre you sure you want to continue? (Y/N) `;
      const confirmed = await yesOrNo(yellow(warning));

      if (!confirmed) {
        process.exit(0);
      }
    }

    logger.log('\nCleaning up node_modules...');

    const cleanupStart = new Date().getTime();

    const { files, reducedSize, removedEmptyDirs } = await clean({
      globs: this.globs,
      noDefaults: this.noDefaults,
      globFile: this.globFile,
      directory: this.directory,
      dryRun: this.dryRun,
    });

    const cleanupDuration = new Date().getTime() - cleanupStart;
    logger.log(green(`Done in ${prettyMs(cleanupDuration)}!`));

    if (this.json) {
      const output: Record<string, unknown> = {
        removedFiles: files.length,
        reducedSize,
        removedEmptyDirs,
        duration: cleanupDuration,
        dryRun: this.dryRun,
      };

      console.log(JSON.stringify(output, null, 2));
    } else {
      logger.log(bold('\nResults:'));
      logger.log('- size reduced:', green(prettyBytes(reducedSize || 0)));
      logger.log('- files removed:', green(files.length));
      logger.log('- empty dirs removed:', green(removedEmptyDirs || 0));
    }
  }
}
